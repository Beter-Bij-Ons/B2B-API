const fs = require("fs");
const PDFDocument = require("pdfkit");
const { uuid } = require('uuidv4');
const admin = require('firebase-admin');




const nodemailer = require('nodemailer');
const { join } = require("path");
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


function createPackingSlip(invoice) {
 
  let doc = new PDFDocument({ size: "A4", margin: 50 });
  const newID = uuid();
 
  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice, invoice.barcodeGenerate);

  generateFooter(doc);
  const fileName = 'B2B-PackingSlip/'+newID+'.pdf';
  const myPdfFile = admin.storage().bucket().file(fileName);




  const bucketFile = myPdfFile.createWriteStream({
    metadata: {
        contentType: 'application/pdf',
        metadata: {
            firebaseStorageDownloadTokens: newID
        },
    },
});

 doc.pipe(bucketFile);



  doc.end();

  bucketFile.on('finish', function(){

    
    return sendOrderEmail(fileName,invoice);
  })

//return newID


}

function getUniqueListBy(arr, key) {
  return [...new Map(arr.map(item => [item[key], item])).values()]
}

function sendOrderEmail(filename,invoice) {

  const email = invoice.shipping.email;
  const firstname = 'Joppe';
  const mailOptions = {
    from: "no-reply@beterbijons.nl",
    to: 'joppe@beterbijons.nl',
    subject: 'Pakbon',
    html:'<!DOCTYPE html><html><head> <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /> <meta name="robots" content="noindex, nofollow"><title>Bestelling</title></head><body style="background: #F5F5F5; color: #333333; font-family: Arial,Helvetica Neue, Helvetica, sans-serif;"><div id="container" style="max-width: 480px; margin: 0 auto; padding: 24px 0"><div id="header" style="text-align: center; background: #ffffff; overflow: auto; border: 1px solid #E6E6E6; border-bottom-style: dashed;border-radius: 6px;"><div id="thankyou" style="color:#6D0707;"><h1>Bedankt voor je bestelling!</h1></div><div id="amount" style="line-height: 22px"> <p style="font-size: 22px">U heeft betaald</p><p style="font-size: 28px; font-weight: 700;">€ '+parseFloat(invoice.total).toFixed(2)+'</p></div></div><div id="body" style="text-align: center; background: #ffffff; overflow: auto; border: 1px solid #E6E6E6; border-bottom-style: dashed; border-top-width: 0; border-radius: 6px; padding: 5%;"><div id="merchant_data" style="float: left; font-size: 18px; overflow: auto; margin-bottom: 30px;"> <p  style="font-size: 14px">In de bijlage vind je de factuur!<br/><br/>  Als je vragen hebt neem dan direct contact met ons op via: <a href="mailto:lisanne@geitengeluk.nl">lisanne@geitengeluk.nl</a>. <br/><br/></p></div></div> </body></html>',
   
  };



 
  const file = admin.storage().bucket().file(filename);



  admin.database().ref('/Prod/PackingSlip-B2B/'+invoice.dbid).update({
      ID:invoice.dbid,
      PackingSlip_Url: filename ,
      Items: invoice.items
  });





  mailOptions.attachments =  [{
    filename: invoice.invoice_nr+"_pakbon.pdf",
    content: file.createReadStream()
  }/*,{
    filename: 'Programmaboekje.pdf',
    path: __dirname+'/Programmaboekje.pdf',
}*/];

  return mailTransport.sendMail(mailOptions).then(() => {

    const mailOptionsIternal ={
      from: 'no-reply@beterbijons.nl',
      to: 'joppe@beterbijons.nl',
      subject: 'Pakbon intern checl',
      html:'Er is een pakbon aangemaakt'
  };

  mailOptionsIternal.attachments =  [{
    filename: invoice.invoice_nr+"_pakbon.pdf",
    content: file.createReadStream()
  }/*,{
    filename: 'Programmaboekje.pdf',
    path: __dirname+'/Programmaboekje.pdf',
}*/];

join.m
  return mailTransport.sendMail(mailOptionsIternal, (err, info) =>{
      if(err){
          return res.send(err.toString());
      }else{
        
          console.log('email sent')}
          response.end();
          return response.status(201).send();
  })
  }).catch(error => {
    console.error(error);
  });
}

function generateHeader(doc) {
  doc
  .image("geitengeluk-logo.png",50, 45, { width: 120 })
  .fillColor("#444444")
  .fontSize(20)
    .text("", 110, 57)
    .fontSize(10)
    .text("Beter Bij Ons B.V.", 200, 50, { align: "right" })
    .text("Teryken 24", 200, 65, { align: "right" })
    .text("5425 PJ, De Mortel", 200, 80, { align: "right" })
    .text("", 200, 95, { align: "right" })
    .text("hallo@beterbijons.nl", 200, 110, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("PAKBON", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Order nr:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("Helvetica")
    .text("Datum:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("", 50, customerInformationTop + 30)
    .text(
     "",
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 340, customerInformationTop)
    .font("Helvetica")
    .text(invoice.shipping.email, 340, customerInformationTop + 15)
    .font("Helvetica")
    .text(invoice.shipping.phone, 340, customerInformationTop + 30)
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice, barcode) {
  let i;
  const invoiceTableTop = 330;



  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Product",
    "Product",
    "Prijs per stuk",
    "Aantal",
    "Lijn Totaal"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  let TopOfPage = 330;

  let itemsTotal = invoice.items;

   itemsTotal.map((item,i) => {

  const position = TopOfPage + (i + 1) * 30;
  if (position > 630) {
console.log('greater:' + position);
    TopOfPage = -300;
    
    
  }
  if(position == 60){
    doc.addPage();
  }
  if(position > 680){
    TopOfPage = -960;
   
  }
  generateTableRow(
    doc,
    position,
    item.ProducerName,
    item.Name,
    "€ "+  item.SinglePrice,
    item.Amount,
    "€ "+ parseFloat((item.SinglePrice*item.Amount)).toFixed(2)
  );

  generateHr(doc, position + 20);
  }
  )

  const salePosition = TopOfPage + (itemsTotal.length+1) *30 ;
  generateTableRow(
    doc,
    salePosition,
    "",
    "",
    "",
    "",
    ""
  );

  const subBTWPosition = salePosition + 20 ;
  generateTableRow(
    doc,
    subBTWPosition,
    "",
    "",
    "",
    "",
    ""
  );

  const subtotalPosition = subBTWPosition + 25;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "",
    "",
    ""
  );

  const subtotalCouponPosition = subtotalPosition + 30;
  generateTableRow(
    doc,
    subtotalCouponPosition,
    "",
    "",
    "",
    "",
   ""
  );

  const totalPosition = subtotalCouponPosition + 35;
  generateTableRow(
    doc.font("Helvetica-Bold"),
    totalPosition,
    "",
    "",
    "",
    "",
    ""
  );

  




  
}





function generateFooter(doc) {
  doc
  .font("Helvetica")
    .fontSize(10)
    .text(
      "",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(cents) {
  return "€" + parseFloat(cents).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + "/" + month + "/" + year;
}

module.exports = {
  createPackingSlip
};