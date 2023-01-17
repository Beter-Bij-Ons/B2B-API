const functions = require("firebase-functions");
const express = require('express');
const { createMollieClient } = require('@mollie/api-client');
const mollieClientMertz= createMollieClient({ apiKey: 'live_sQWaKA4hU23CCkD4UPb9Rn6rsnbFDR' });
const mollieClientFantasi= createMollieClient({ apiKey: 'test_R2dg5AHTfsBw6tNQbfqaz39tMJH8MQ' });
const mollieClientGeitengeluk= createMollieClient({ apiKey: 'live_TBM9M6wswysgq3eKTQgn8NSddr8RVn' });

const admin = require('firebase-admin');
const { createInvoiceMertz } = require("./CreateInvoice");
const { uuid } = require("uuidv4");
const { createPackingSlip } = require("./CreatePackagingslip");
const { createInvoiceGeitengeluk } = require("./CreateInvoiceGeitengeluk");
const { createInvoiceChristmass } = require("./CreatveInvoiceChristmass");

admin.initializeApp();

exports.PaymentControllerMertz = functions.https.onRequest((req, res) => {
    const payment= '';
    
    const paymentdata = req.body;
   // After which you can create an iDEAL payment with the selected issuer.
   mollieClientMertz.payments
   .create({
     amount: { value: paymentdata.totalPrice, currency: 'EUR' },
     description: "Bestelling: "+ paymentdata.bookingId,
     metadata:{
       orderId:paymentdata.bookingId,
    },

     redirectUrl: `https://mertz.beterbijons.nl/bedankt`,
     webhookUrl: `https://us-central1-bbo-platform.cloudfunctions.net/MertzPaymentWebhook`,
 
   })
   .then(payment => {

     //console.log("order"+payments);
     res.redirect(payment.getPaymentUrl());
     // Redirect the consumer to complete the payment using `payment.getPaymentUrl()`.   
   })
   .catch(error => {
     // Do some proper error handling.
     res.send(error);
   });
});

exports.PaymentControllerGeitengeluk = functions.https.onRequest((req, res) => {
  const payment= '';
  
  const paymentdata = req.body;
 // After which you can create an iDEAL payment with the selected issuer.
 mollieClientGeitengeluk.payments
 .create({
   amount: { value: paymentdata.totalPrice, currency: 'EUR' },
   description: "Bestelling: "+ paymentdata.bookingId,
   metadata:{
     orderId:paymentdata.bookingId,
  },

   redirectUrl: `https://geitengeluk.nl/bedankt`,
   webhookUrl: `https://us-central1-bbo-platform.cloudfunctions.net/GeitengelukPaymentWebhook`,

 })
 .then(payment => {

   //console.log("order"+payments);
   res.redirect(payment.getPaymentUrl());
   // Redirect the consumer to complete the payment using `payment.getPaymentUrl()`.   
 })
 .catch(error => {
   // Do some proper error handling.
   res.send(error);
 });
});

exports.PackingSlipController = functions.https.onRequest((req, res) => {

  admin.database().ref('/Test/Orders-Temp-B2B/'+req.body.ID).once('value',(snapshot) =>{
    
        let state = snapshot.val();

       
               
  const invoice = {
    shipping: {
        name:'PakbonTest',
        email: 'joppe@beterbijons.nl',
      },
      items: state.ShoppingBag,
      dbid:'TEST',
      invoice_nr:'TEST'
    };
  createPackingSlip(invoice)
  


})


  

})

exports.PaymentControllerFantasi = functions.https.onRequest((req, res) => {
  const payment= '';
  const paymentdata = req.body;
 // After which you can create an iDEAL payment with the selected issuer.
 mollieClientFantasi.payments
 .create({
   amount: { value: paymentdata.totalPrice, currency: 'EUR' },
   description: "Bestelling: "+ paymentdata.bookingId,
   metadata:{
     orderId:paymentdata.bookingId,
  },

   redirectUrl: `https://fantasi.beterbijons.nl/bedankt`,
   webhookUrl: `https://us-central1-bbo-platform.cloudfunctions.net/FantasiPaymentWebhook`,

 })
 .then(payment => {

   //console.log("order"+payments);
   res.redirect(payment.getPaymentUrl());
   // Redirect the consumer to complete the payment using `payment.getPaymentUrl()`.   
 })
 .catch(error => {
   // Do some proper error handling.
   res.send(error);
 });
});

let GenerateUniqueID = () =>{
  unique_id = uuid();

  return unique_id;
}

exports.DeleteProductsFromProducent = functions.https.onRequest((request, response) => {



  admin.database().ref('/Prod/Products/').once('value',(snapshot) =>{
    snapshot.forEach((childSnap) => {
        let state = childSnap.val();
       
        let Fetchdata = request.body;
        console.log('hello')
        if(state.Producent_ID == Fetchdata.Producent_ID){

          console.log(state.ID)
                                   
            admin.database().ref('/Prod/Products/'+state.ID).remove()
        }})
      }).then(()=>{
        return response.status(201).end();
      })


})

exports.GetProducers = functions.https.onRequest((req, res) => {

  admin.database().ref('/Prod/Producers/').once('value', snapshot =>{
    let state = snapshot.val();
    let ToClient = JSON.stringify(state);
    res.status(200).json(ToClient)

})



})

exports.UploadB2BExcel = functions.https.onRequest((request, response) => {

  let dateImportArray = request.body;

  
  dateImportArray.map((product,i)=>{
    let newProductID = GenerateUniqueID();
    admin.database().ref('/Prod/Products/'+newProductID).update({
      BTW:  product.BTW  == undefined ?'':product.BTW,
      CanShip: false,
      Categorie_ID: product.Artikelgroep == undefined ? '':product.Artikelgroep,
      Desc:product.Omschrijving == undefined?'':product.Omschrijving,
      MayContain:'-',
      Has_Variations:'false',
      ID: newProductID,
      Ingredients: product.ingredienten == undefined ?'':product.ingredienten,
      Name: product.Artikelnaam ,
      Unit:  product.Eenheid== undefined ?'':product.Eenheid,
      Producent_ID: product.ID,
      Product_ID: newProductID,
      Status:Boolean(true),
      B2B_Possible: product.doelgroep =='B2B'?true:false,
      B2C_Possible: product.doelgroep =='B2C'?true:false,
      Season:product.beschikbaarheid == undefined ?'':product.beschikbaarheid,
      Production_Limburg:"nee",
      Trade_Limburg:"nee",
      Origin_Ingredients: product.Origin_Ingredients ==undefined ?'':  product.Origin_Ingredients,
      Health:'',
      Shelf_Life:product.Shelf_Life ==undefined ?'':product.Shelf_Life,
      URL: '',
      Packaging:product.Packaging == undefined ?'':product.Packaging,
                  Delivery_Time:product.Beschikbaarheid == undefined ?'':product.Beschikbaarheid,
                  PackagingSize:product.Size ==undefined ?'': product.Size,
                  FoodhubStock_ID:'-',
                  FoodhubStock_JN:'-',

     
                  Price: product.Prijs == undefined ?'': product.Prijs,
                  Product_ID:newProductID,
                  PriceB2B:product.PriceB2B  == undefined ?'': product.PriceB2B,
                  MinOrderB2B:product.MinOrderB2B == undefined ?'':product.MinOrderB2B,
                  Quantity:0,
                  EAN:product.ean == undefined ?'':product.ean,
                  Energie:product.Energie == undefined ?'':product.Energie,
                  Vet:product.Vet == undefined ?'':product.Vet,
                  VerzadigdVet: product.Verzadigd == undefined ?'':product.Verzadigd,
                  Koolhydraten: product.Koolhydraten == undefined ?'':product.Koolhydraten,
                  Suikers:product.Suikers == undefined ?'':product.Suikers,
                  Eiwit:product.Eiwit == undefined ?'':product.Eiwit,
                  Zout:product.Zout == undefined ?'':product.Zout
      
  }).then(()=>{
    admin.database().ref('/Prod/Products/'+newProductID+'/Allergens').update({
          Egg:false,
          Gluten:false,
          Earthnuts:false,
          Lupine:false,
          Milk:false,
          Nuts:false,
          Mustard:false,
          Shellfish:false,
          Celery:false,
          Sesam:false,
          Soja:false,
          Fish:false,
          Mollusks:false,
          Sulfur:false
      }).then(async()=>{
        admin.database().ref('/Prod/Products/'+newProductID+'/Hallmarks').update({
              Puur_NL:false,
              Marren:false,
              Earthnuts:false,
              Erkend_streekproduct:false,
              Gijs:false,
              Groene_Hart_Streekproducten:false,
          })
        
     

              

          
      })



     
  }).catch((error)=>{
     
      console.log(error)
  
  })

  let UniqueProductVariationId = GenerateUniqueID();
               admin.database().ref('/Prod/ProductVariations/'+UniqueProductVariationId).update({
                  FoodhubStock_ID:'-',
                  FoodhubStock_JN:'-',
                  ID:UniqueProductVariationId,
                  Name: product.Artikelnaam,
                  Price: product.Prijs == undefined ?'': product.Prijs,
                  Product_ID:newProductID,
                  PriceB2B:product.PriceB2B  == undefined ?'': product.PriceB2B,
                  MinOrderB2B:product.MinOrderB2B == undefined ?'':product.MinOrderB2B,
                  Quantity:0,
                  EAN:product.ean == undefined ?'':product.ean
              }).then(()=>{
                 console.log('done importing')
                 return response.status(201).end();
              })
  })
        
       

})


exports.MertzPaymentWebhook = functions.https.onRequest((request, response) => {
    console.log("payment id is" , request.body.id);
    mollieClientMertz.payments.get(request.body.id)
    .then(payment => {
        if (payment.error) {
            console.error('payment error: ', payment.error);
            response.end();
        }

        if(payment.isPaid()){

             admin.database().ref('/Prod/Orders/').once('value',(snapshot) =>{
                snapshot.forEach((childSnap) => {
                    let state = childSnap.val();

                    if(state.ID == payment.metadata.orderId){
                                               
                        admin.database().ref('/Prod/Orders/'+state.ID).update({
                            Paid_Status:'paid'
                        })

                      
                        const invoice = {
                            shipping: {
                                name: state.User_Name,
                                email: state.User_Email,
                                phone: state.User_Phone,
                                street:state.User_Address_1,
                                city: state.User_Address_2,
                                country:state.User_Country
                              },
                              items: state.Items,
                              dbid: state.ID,
                              subtotal:state.Total_Price,
                              coupon: false,
                              total: state.Total_Price,
                              invoice_nr:state.ID
                            };

                            state.Items.map((product)=>{
                              let ref = admin.database().ref('/Prod/ProductVariations/'+product.Variant_ID);
                              ref.once('value' , snapshot => {
                        
                                let state = snapshot.val();
                       
                                    admin.database().ref('/Prod/ProductVariations/'+product.Variant_ID).update({
                                        Quantity: (Number(state.Quantity)-Number(product.amount)).toString(),
                                    
                                
                                    })
                                })
                            })                 
                    
                    createInvoiceMertz(invoice);
                    return response.status(201).end();

                       
                    }else{
                        console.log('no match')
                    }
               
               
                })
            })

           /* */
        
        }
        return response.status(201).end();
    });
});

exports.GeneratePackingSlipB2B = functions.https.onRequest((request, response) => {

  console.log('ID is:'+ request.body.PackingSlipID)
  admin.database().ref('/Prod/PackingSlip-Temp-B2B/'+request.body.PackingSlipID).once('value',(snapshot) =>{

    let State = snapshot.val();

    const PackingSLip = {
      shipping: {
          name: 'Provincie Limburg',
          email: 'provincielimburg@vitam.nl',
          phone: '',
          street:'Limburglaan 10, 6229 GA',
          city: 'Randwyck-Maastricht',
          country: 'Nederland'
        },
        items: State.Items,
        dbid: State.ID,
        invoice_nr:State.ID
      };

                  
      createPackingSlip(PackingSLip);
      return response.status(201).end();

  })
})

exports.GenerateInvoiceChristmasB2C = functions.https.onRequest((request, response) => {

  console.log('ID is:'+ request.body.PackingSlipID)
  admin.database().ref('/Prod/Invoice-kerstmarkt-B2C/'+request.body.PackingSlipID).once('value',(snapshot) =>{

    let State = snapshot.val();

    const PackingSLip = {
      shipping: {
          name: '',
          email: request.body.Email,
          phone: '',
          street:'',
          city: '',
          country: ''
        },
        items: State.Items,
        dbid: State.ID,
        invoice_nr:State.ID
      };

                  
      createInvoiceChristmass(PackingSLip);
      return response.status(201).end();

  })
})

exports.GeitengelukPaymentWebhook = functions.https.onRequest((request, response) => {
  console.log("payment id is" , request.body.id);
  mollieClientGeitengeluk.payments.get(request.body.id)
  .then(payment => {
      if (payment.error) {
          console.error('payment error: ', payment.error);
          response.end();
      }

      if(payment.isPaid()){

           admin.database().ref('/Prod/Orders/').once('value',(snapshot) =>{
              snapshot.forEach((childSnap) => {
                  let state = childSnap.val();

                  if(state.ID == payment.metadata.orderId){
                                             
                      admin.database().ref('/Prod/Orders/'+state.ID).update({
                          Paid_Status:'paid'
                      })

                    
                      const invoice = {
                          shipping: {
                              name: state.User_Name,
                              email: state.User_Email,
                              phone: state.User_Phone,
                              street:state.User_Address_1,
                              city: state.User_Address_2,
                              country:state.User_Country
                            },
                            items: state.Items,
                            dbid: state.ID,
                            subtotal:state.Total_Price,
                            coupon: state.CouponActive,
                            shippingType:state.Send_Type, 
                            total: state.Total_Price,
                            invoice_nr:state.ID
                          };

                          state.Items.map((product)=>{
                            let ref = admin.database().ref('/Prod/ProductVariations/'+product.Variant_ID);
                            ref.once('value' , snapshot => {
                      
                              let state = snapshot.val();
                     
                                  admin.database().ref('/Prod/ProductVariations/'+product.Variant_ID).update({
                                      Quantity: (Number(state.Quantity)-Number(product.amount)).toString(),
                                  
                              
                                  }) 
                              })
                          })                 
                  
                  createInvoiceGeitengeluk(invoice);
                  return response.status(201).end();

                     
                  }else{
                      console.log('no match')
                  }
             
             
              })
          })

         /* */
      
      }
      return response.status(201).end();
  });
});

exports.FantasiPaymentWebhook = functions.https.onRequest((request, response) => {
  console.log("payment id is" , request.body.id);
  mollieClientFantasi.payments.get(request.body.id)
  .then(payment => {
      if (payment.error) {
          console.error('payment error: ', payment.error);
          response.end();
      }

      if(payment.isPaid()){

           admin.database().ref('/Prod/Orders/').once('value',(snapshot) =>{
              snapshot.forEach((childSnap) => {
                  let state = childSnap.val();

                  if(state.ID == payment.metadata.orderId){
                                             
                      admin.database().ref('/Prod/Orders/'+state.ID).update({
                          Paid_Status:'paid'
                      })

                    
                      const invoice = {
                          shipping: {
                              name: state.User_Name,
                              email: state.User_Email,
                              phone: state.User_Phone,
                              street:state.User_Address_1,
                              city: state.User_Address_2,
                              country:state.User_Country
                            },
                            items: state.Items,
                            dbid: state.ID,
                            subtotal:state.Total_Price,
                            coupon: false,
                            total: state.Total_Price,
                            invoice_nr:state.ID
                          };

                          state.Items.map((product)=>{
                            let ref = admin.database().ref('/Prod/ProductVariations/'+product.Variant_ID);
                            ref.once('value' , snapshot => {
                      
                              let state = snapshot.val();
                     
                                  admin.database().ref('/Prod/ProductVariations/'+product.Variant_ID).update({
                                      Quantity: (Number(state.Quantity)-Number(product.amount)).toString(),
                                  
                              
                                  })
                              })
                          })                 
                  
                  createInvoiceFantasi(invoice);
                  return response.status(201).end();

                     
                  }else{
                      console.log('no match')
                  }
             
             
              })
          })

         /* */
      
      }
      return response.status(201).end();
  });
});



exports.OrderB2BMondaySendMercedes = functions.pubsub.schedule('0 12 * * 1').timeZone('Europe/Stockholm').onRun((context) =>{
  const nodemailer = require('nodemailer');
  let mailTransport = nodemailer.createTransport({
    host:"mail.zxcs.nl",
    port: "465",
    
    auth:{
        user: "no-reply@beterbijons.nl",
        pass:"Gvu#AOS5!Ug53iLJ%yP*6*!cGoGH@UXx^id"
    },
    secureConnection: false,
    tls: { ciphers: 'SSLv3' }
  });


  let Producers_Raw = [];
  let Producers_Information = [];
  let Product_Lines = [];


  let today = new Date();
  admin.database().ref('/Prod/Order-Slots/').once('value',(snapshot) =>{
    snapshot.forEach((childSnap) => {
      console.log('1')
        let stateSlot = childSnap.val();

        if(stateSlot.Slot ==  today.getDate()+'-0'+(today.getMonth()+1)+'-'+today.getFullYear() && stateSlot.Deadline == '12.00' && stateSlot.Location == 'Mercedes'){
          admin.database().ref('/Prod/Orders-Temp-B2B/'+stateSlot.ID).once('value',(snapshot) =>{
  
            let state = snapshot.val();
    
    
    
            state.Items.map((list) => {
            
              if(Producers_Raw.indexOf(list.Producent_ID) !== -1){
                Product_Lines.push(list)
              }else{
                Producers_Raw.push(list.Producent_ID)
                Product_Lines.push(list)
              }
           
    
            
    
            })
      }).then(()=>{
    
        console.log('2')
        admin.database().ref('/Prod/Producers/').once('value',(snapshot) =>{
          snapshot.forEach((childSnap) => {
              let state = childSnap.val();
    
      
              for(let i = 0; i < Producers_Raw.length; i++){
                if(Producers_Raw[i] == state.ID){
                
                     New_Producent = {ID: state.ID, Name:state.Name, Email: state.Email}
                    Producers_Information.push(New_Producent)
                
                }
              } 
      
      
          })
        })
    
      }).then(()=>{
        console.log('3')
    
    setTimeout(()=>{

        for(let i =0; i < Producers_Information.length; i++){
          
          let itemlist =[];
          for(let l=0; l < Product_Lines.length; l++){
            if(Producers_Information[i].ID == Product_Lines[l].Producent_ID && Number(Product_Lines[l].Amount) != 0){
                  let List_Item = {Product_ID:Product_Lines[l].ID, Product_Name:Product_Lines[l].ProductName, Product_Amount:Product_Lines[l].Amount, EAN:Product_Lines[l].EAN, Producent_ID:Producers_Information[i].ID,Producent_Name:Producers_Information[i].Name}
       
              itemlist.push(List_Item)
         
            }
          
          }
          var arrayItems = "";
          var n;
          for (n in itemlist) {
            arrayItems += "<tr><td>" + itemlist[n].Product_Name + "</td><td>"+itemlist[n].Product_Amount+"</td><td>"+itemlist[n].EAN+"</td></tr>";
          }

   

            let Today = new Date();

          const mailOptions = {
            from: "no-reply@beterbijons.nl",
            to: Producers_Information[i].Email,
            bcc:'simone@beterbijons.nl,shirley@beterbijons.nl,hallo@beterbijons.nl,joppe@beterbijons.nl',
            subject: 'Bestelling bij ' + Producers_Information[i].Name,
            html:'<html lang="en"><head> <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /> <meta name="robots" content="noindex, nofollow"><title>B2B - Bestelling</title> <style> table {font-family: arial, sans-serif;border-collapse: collapse;width: 100%;} td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}</style><link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/css/bootstrap.min.css" rel="stylesheet"></head><body><main role="main" class="container"><div class="row"> <div class="col-8"><h1 class="text-center">Bestelling streekproductenplein</h1><img src="https://firebasestorage.googleapis.com/v0/b/bbo-platform.appspot.com/o/Prod%2Fb2b%2Fmail-image.jpg?alt=media&token=02b8a7d8-48bb-4713-ab53-bc6edeed1f20" /><h5 class="text-left" style="padding-top:10px;">Bericht van streekproductenplein</h5><p class="text-left">Er is een bestelling binnen gekomen van Vitam op het streekproductenplein voor '+Producers_Information[i].Name+'<br/><br/>Verzamel de producten en draag er zorg voor dat ze afgeleverd worden bij Mertz Kleinfruit, Julianaweg 6a, 6265 AJ Sint Geertruid. Mertz zorgt ervoor dat de bestelling geleverd wordt aan het Provinciehuis.</p></div><div class="col-4 border border-dark"><h4>Order details</h4><p class="lead">Order Nummer: '+stateSlot.ID+'</p><p>Besteldatum: '+Today.getDate()+'/'+(Today.getMonth()+1)+'/'+Today.getFullYear()+'</p><p></p><h4>Afleveren bij:</h4><p>Mertz Kleinfruit</p><p>Julianaweg 6a</p><p>APT 7</p><p>6265 AJ</p><p>Sint Geertruid</p></div> </div><hr/><table><tr> <th>Naam</th><th>Aantal</th><th>Artikelcode</th></tr>'+arrayItems+'</table><div class="row"> <div class="col-12"> </div></div></main> <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/js/bootstrap.min.js"></script></body></html>'
          };

          console.log('get Mail ready')
        
          
          if(arrayItems !=""){
            mailTransport.sendMail(mailOptions).then(() => {
              console.log('Mail send')
            
            })
          }
        
    
    
          
    
    
        }
    
    
    

        
    
    
      },1500) 
    
      }).finally(()=>{
      
      })
    
                                   
            admin.database().ref('/Prod/Order-Slots/'+stateSlot.ID).update({
              OrderStatusBlocked:true,
              Status:'shipped'
            })
            admin.database().ref('/Prod/Orders-Temp-B2B/'+stateSlot.ID).update({
         
              Status:'shipped'
            })
        }})
      
      })

  
});


exports.TestExcelExportMail = functions.https.onRequest((request, response) => {
  let ProducersList = [];
  let ProductsList = [];
  let ProductsVariationsList = [];
  let CombinedRow = []

  admin.database().ref('/Prod/Producers/').once('value',(snapshot) =>{
    let state = snapshot.val();
    

    ProducersList = state;
  }).then(()=>{

   

    admin.database().ref('/Prod/Products/').once('value',(snapshot) =>{
      let state = snapshot.val();
      
  
      ProductsList = state;
    }).then(()=>{
      admin.database().ref('/Prod/ProductVariations/').once('value',(snapshot) =>{
        let state = snapshot.val();
        
    
        ProductsVariationsList = state;
      }).then(()=>{

        Object.keys(ProducersList).map((producer) =>{
 

            Object.keys(ProductsList).filter((product) => ProductsList[product].Producent_ID == ProducersList[producer].ID).map((product) =>{

       
              Object.keys(ProductsVariationsList).filter((productVar) => ProductsList[product].ID == ProductsVariationsList[productVar].Product_ID).map((productVar) =>{

                let TotalObject ={
                  Producent_Naam:ProducersList[producer].Name,
                Producent_Address_1: ProducersList[producer].Address_1,
                Producent_Address_2: ProducersList[producer].Address_2,
                Producent_Country_ID:ProducersList[producer].Country_ID,
                Producent_B2B_Client: ProducersList[producer].B2B_Client ? 'Ja' : 'Nee' ,
                Producent_BTW_Number: ProducersList[producer].BTW_Number,
                Producent_ContactPersonName:ProducersList[producer].ContactPersonName,
                Producent_Email: ProducersList[producer].Email,
                Producent_Goverment: ProducersList[producer].Goverment,
                Producent_KVK_Number: ProducersList[producer].KVK_Number,
                Producent_Phone: ProducersList[producer].Phone,
                Producent_Website:ProducersList[producer].Website ,
                Product_Allergens: ProductsList[product].Allergens,
                Product_B2B_Possible: ProductsList[product].B2B_Possible ? 'Ja' : 'Nee',
                Product_B2C_Possible: ProductsList[product].B2C_Possible ? 'Ja' : 'Nee',
                Product_BTW: ProductsList[product].BTW ,
                Product_Biologic: ProductsList[product].Biologic ,
                Product_CanShip: ProductsList[product].CanShip ? 'Ja' : 'Nee' ,
                Product_Categorie_ID: ProductsList[product].Categorie_ID               ,
                Product_Christmass_Package: ProductsList[product].Christmass_Package ? 'Ja' : 'Nee' ,
                Product_DeliveryTime: ProductsList[product].DeliveryTime ,
                Product_Delivery_Time: ProductsList[product].Delivery_Time ,
                Product_Desc: ProductsList[product].Desc ,
                Product_Desc_Shelf_Life: ProductsList[product].Desc_Shelf_Life ,
                Product_Hallmakrs: ProductsList[product].Hallmakrs ,
                Product_Health: ProductsList[product].Health ,
                Product_Ingredients: ProductsList[product].Ingredients ,
                Product_MayContain: ProductsList[product].MayContain ,
                Product_Name: ProductsList[product].Name ,
                Product_Origin_Ingredients: ProductsList[product].Origin_Ingredients ,
                Product_Packaging: ProductsList[product].Packaging ,
                Product_PackagingSize: ProductsList[product].PackagingSize ,
                Product_Production_Limburg: ProductsList[product].Production_Limburg ,
                Product_Promo_Material: ProductsList[product].Promo_Material ,
                Product_Season: ProductsList[product].Season ,
                Product_Shelf_Life: ProductsList[product].Shelf_Life ,
                Product_Special_Info: ProductsList[product].Special_Info ,
                Product_Status: ProductsList[product].Status ? 'Beschikbaar' : 'Niet beschikbaar' ,
                Product_Trade_Limburg: ProductsList[product].Trade_Limburg ,
                Product_URL: ProductsList[product].URL,
                Product_EAN_Article_Code:ProductsVariationsList[productVar].EAN ,
                Product_MinOrderB2B: ProductsVariationsList[productVar].MinOrderB2B,
                Product_Variant_Name: ProductsVariationsList[productVar].Variant_Name,
                Product_Price_B2C: ProductsVariationsList[productVar].Price,
                Product_Price_B2B: ProductsVariationsList[productVar].PriceB2B,
                Product_Quantity: ProductsVariationsList[productVar].Quantity
  
  
  
               }

               CombinedRow.push(TotalObject);

              
                console.log(TotalObject)
              
              
              })
            })


          })

      })
  
  
    });

      

  });




})











exports.TestMailB2B = functions.https.onRequest((request, response) => {
 
  const nodemailer = require('nodemailer');
  let mailTransport = nodemailer.createTransport({
    host:"mail.zxcs.nl",
    port: "465",
    
    auth:{
        user: "no-reply@beterbijons.nl",
        pass:"Gvu#AOS5!Ug53iLJ%yP*6*!cGoGH@UXx^id"
    },
    secureConnection: false,
    tls: { ciphers: 'SSLv3' }
  });

  const paymentdata = request.body;

  let Producers_Raw = [];
  let Producers_Information = [];
  let Product_Lines = [];


  let today = new Date();
  admin.database().ref('/Prod/Order-Slots/').once('value',(snapshot) =>{
    snapshot.forEach((childSnap) => {
      console.log('1')
        let stateSlot = childSnap.val();
        console.log('date : '+ paymentdata.date)
        console.log('date Slot: '+ stateSlot.Slot)

        console.log('timeslot : '+ paymentdata.timeslot)
        console.log('date Deadline: '+ stateSlot.Deadline)

        console.log('location : '+ paymentdata.location)
        console.log('date Location: '+ stateSlot.Location)

        if(stateSlot.Slot ==  paymentdata.date && stateSlot.Deadline == paymentdata.timeslot && stateSlot.Location == paymentdata.location){
          admin.database().ref('/Prod/Orders-Temp-B2B/'+stateSlot.ID).once('value',(snapshot) =>{
  
            let state = snapshot.val();
    
    
    
            state.Items.map((list) => {
            
              if(Producers_Raw.indexOf(list.Producent_ID) !== -1){
                Product_Lines.push(list)
              }else{
                Producers_Raw.push(list.Producent_ID)
                Product_Lines.push(list)
              }
           
    
            
    
            })
      }).then(()=>{
    
        console.log('2')
        admin.database().ref('/Prod/Producers/').once('value',(snapshot) =>{
          snapshot.forEach((childSnap) => {
              let state = childSnap.val();
    
      
              for(let i = 0; i < Producers_Raw.length; i++){
                if(Producers_Raw[i] == state.ID){
                
                     New_Producent = {ID: state.ID, Name:state.Name, Email: 'joppe@pixelpros.nl'}
                    Producers_Information.push(New_Producent)
                
                }
              } 
      
      
          })
        })
    
      }).then(()=>{
        console.log('3')
    
    setTimeout(()=>{

        for(let i =0; i < Producers_Information.length; i++){
          
          let itemlist =[];
          for(let l=0; l < Product_Lines.length; l++){
            if(Producers_Information[i].ID == Product_Lines[l].Producent_ID && Number(Product_Lines[l].Amount) != 0){
                  let List_Item = {Product_ID:Product_Lines[l].ID, Product_Name:Product_Lines[l].ProductName, Product_Amount:Product_Lines[l].Amount, EAN:Product_Lines[l].EAN, Producent_ID:Producers_Information[i].ID,Producent_Name:Producers_Information[i].Name}
       
              itemlist.push(List_Item)
         
            }
          
          }
          var arrayItems = "";
          var n;
          for (n in itemlist) {
            arrayItems += "<tr><td>" + itemlist[n].Product_Name + "</td><td>"+itemlist[n].Product_Amount+"</td><td>"+itemlist[n].EAN+"</td></tr>";
          }

   

            let Today = new Date();

          const mailOptions = {
            from: "no-reply@beterbijons.nl",
            to: Producers_Information[i].Email,
            bcc:'simone@beterbijons.nl,shirley@beterbijons.nl,hallo@beterbijons.nl,joppe@beterbijons.nl',
            subject: 'Bestelling bij ' + Producers_Information[i].Name,
            html:'<html lang="en"><head> <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /> <meta name="robots" content="noindex, nofollow"><title>B2B - Bestelling</title> <style> table {font-family: arial, sans-serif;border-collapse: collapse;width: 100%;} td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}</style><link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/css/bootstrap.min.css" rel="stylesheet"></head><body><main role="main" class="container"><div class="row"> <div class="col-8"><h1 class="text-center">Bestelling streekproductenplein</h1><img src="https://firebasestorage.googleapis.com/v0/b/bbo-platform.appspot.com/o/Prod%2Fb2b%2Fmail-image.jpg?alt=media&token=02b8a7d8-48bb-4713-ab53-bc6edeed1f20" /><h5 class="text-left" style="padding-top:10px;">Bericht van streekproductenplein</h5><p class="text-left">Er is een bestelling binnen gekomen van Vitam op het streekproductenplein voor '+Producers_Information[i].Name+'<br/><br/>Verzamel de producten en draag er zorg voor dat ze morgenvroeg “19-07-2022” om “11.00 uur” afgeleverd zijn bij Mertz Kleinfruit, Julianaweg 6a, 6265 AJ Sint Geertruid. Mertz zorgt ervoor dat de bestelling geleverd wordt aan het Provinciehuis.</p></div><div class="col-4 border border-dark"><h4>Order details</h4><p class="lead">Order Nummer: '+stateSlot.ID+'</p><p>Besteldatum: '+Today.getDate()+'/'+(Today.getMonth()+1)+'/'+Today.getFullYear()+'</p><p></p><h4>Afleveren bij:</h4><p>Mertz Kleinfruit</p><p>Julianaweg 6a</p><p>APT 7</p><p>6265 AJ</p><p>Sint Geertruid</p></div> </div><hr/><table><tr> <th>Naam</th><th>Aantal</th><th>Artikelcode</th></tr>'+arrayItems+'</table><div class="row"> <div class="col-12"> </div></div></main> <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/js/bootstrap.min.js"></script></body></html>'
          };

          console.log('get Mail ready')
        
          
          if(arrayItems !=""){
            mailTransport.sendMail(mailOptions).then(() => {
              console.log('Mail send')
            
            })
          }
        
    
    
          
    
    
        }
    
    
    

        
    
    
      },1500) 
    
      }).finally(()=>{
      
      })
    
                                   
            admin.database().ref('/Prod/Order-Slots/'+stateSlot.ID).update({
              OrderStatusBlocked:true,
              Status:'shipped'
            })
            admin.database().ref('/Prod/Orders-Temp-B2B/'+stateSlot.ID).update({
         
              Status:'shipped'
            })
        }})
      
      })



})

exports.TestMailQR = functions.https.onRequest((request, response) => {
 
  const nodemailer = require('nodemailer');

  

  let data = request.body;
  let mailTransport = nodemailer.createTransport({
    host:"mail.zxcs.nl",
    port: "465",
    
    auth:{
        user: "no-reply@beterbijons.nl",
        pass:"Gvu#AOS5!Ug53iLJ%yP*6*!cGoGH@UXx^id"
    },
    secureConnection: false,
    tls: { ciphers: 'SSLv3' }
  });

  let QrURL = '';

  const QRCode = require('qrcode');

  QRCode.toDataURL('I am a pony!', function (err, url) {
    const mailOptions = {
      from: "no-reply@beterbijons.nl",
      to: 'joppe@pixelpros.nl',
      subject: 'Bestelling bij ',
      html:'<html lang="en"><head> <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /> <meta name="robots" content="noindex, nofollow"><title>B2B - Bestelling</title> <style> table {font-family: arial, sans-serif;border-collapse: collapse;width: 100%;} td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;}tr:nth-child(even) {background-color: #dddddd;}</style><link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/css/bootstrap.min.css" rel="stylesheet"></head><body><main role="main" class="container"><div class="row"> <div class="col-8"><h1 class="text-center">Api2Pdf</h1><img src="https://www.api2pdf.com/wp-content/uploads/2018/07/600x150.png" /><h5 class="text-left" style="padding-top:10px;">Message from Purchaser</h5><p class="text-left">Api2Pdf is a powerful PDF generation API with no rate limits or file size constraints. Generate PDFs from HTML, URLs, images, office documents, and more. Merge PDFs together. Api2Pdf runs on AWS Lambda, a serverless architecture powered by Amazon to scale to millions of requests while being up to 90% cheaper than alternatives. The REST API provides endpoints for WKHTMLTOPDF, Headless Chrome, LibreOffice, and Merge PDFs. Learn more at<a href="https://www.api2pdf.com">https://www.api2pdf.com</a></p></div><div class="col-4 border border-dark"><img src="'+url+'" /><h4>Order Information</h4><p class="lead">Order Number: 123456</p><p>Purchased: 01/01/2018</p><p>Shipped: 01/01/2018</p><h4>Shipping To</h4><p>Provincie</p><p>123 Angel Blvd</p><p>APT 7</p><p>New York, NY 11111</p><p>United States</p></div> </div><hr/><table><tr> <th>Naam</th><th>Aantal</th><th>Besteldatum</th></tr></table><div class="row"> <div class="col-12"> </div></div></main> <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/js/bootstrap.min.js"></script></body></html>'
    };
  
    
    
   mailTransport.sendMail(mailOptions).then(() => {
      
    })

  })

  //let file = {name: 'Test.pdf', content: '<html lang="en"><head><link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/css/bootstrap.min.css" rel="stylesheet"></head><body><main role="main" class="container"><div class="row"> <div class="col-8"><h1 class="text-center">Api2Pdf</h1><img src="https://www.api2pdf.com/wp-content/uploads/2018/07/600x150.png" /><h5 class="text-left" style="padding-top:10px;">Message from Purchaser</h5><p class="text-left">Api2Pdf is a powerful PDF generation API with no rate limits or file size constraints. Generate PDFs from HTML, URLs, images, office documents, and more. Merge PDFs together. Api2Pdf runs on AWS Lambda, a serverless architecture powered by Amazon to scale to millions of requests while being up to 90% cheaper than alternatives. The REST API provides endpoints for WKHTMLTOPDF, Headless Chrome, LibreOffice, and Merge PDFs. Learn more at<a href="https://www.api2pdf.com">https://www.api2pdf.com</a></p></div><div class="col-4 border border-dark"><img src="http://www.api2pdf.com/wp-content/uploads/2018/07/download-1.png" /><h4>Order Information</h4><p class="lead">Order Number: 123456</p><p>Purchased: 01/01/2018</p><p>Shipped: 01/01/2018</p><h4>Shipping To</h4><p>John Doe</p><p>123 Angel Blvd</p><p>APT 7</p><p>New York, NY 11111</p><p>United States</p></div> </div><hr/>'+arrayItems+'<div class="row"> <div class="col-12"> </div></div></main> <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/js/bootstrap.min.js"></script></body></html>' };


  



})