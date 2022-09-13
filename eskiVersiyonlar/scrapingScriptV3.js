const puppeteer = require('puppeteer');
const fs = require('fs');
async function scrollToBottom(page,_distance) {
  const distance = _distance; // should be less than or equal to window.innerHeight
  const delay = 100;
  while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
    await page.evaluate((y) => { document.scrollingElement.scrollBy(0, y); }, distance);
    await page.waitForTimeout(delay);
  }
  await page.waitForTimeout(3000);
}

const click = async(page,target,waitTime=2000) => {
  await page.waitForTimeout(waitTime)
  await page.click(target)
  await page.waitForTimeout(waitTime)
}

const try_ = async(page,section,chapter,heading) => {
  await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  try {
    await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section})`)
    await page.waitForTimeout(2000)
    await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter})`)
    await page.waitForTimeout(2000)
    await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${heading})`)
    await page.waitForTimeout(2000)
  } catch (error) {
    console.log('Sayfa yenilenmesinden sonra hata oluştu')
  }
}
const getDataLength = async (page,section,chapter,heading) => {
  let dataLength = 100
  for (let index = 0; index < 3; index++) {
    try {
      // console.log(`Deneme ${index+1}`)
      await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${heading}) > div:nth-last-child(1)>div:nth-child(2)`)
      await page.waitForTimeout(1000)
      dataLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${heading})` , 
      element => element.children[1].children.length-1)
      break
    } catch (error) {
      // console.log('Tekrar deneniyor')
      await try_(page,section,chapter,heading,index)
    }
  }
  return dataLength === 100 ? 100 : dataLength+2;
}

(async () => {
  let startTime = performance.now()

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--window-size=1200,1600']
  });
  const page = await browser.newPage();
  await page.goto('https://www.wcotradetools.org/en/harmonized-system');
  

  /* 
    Bu versiyonda section1'i bu hali ile 8 dakika 34 saniyede çekebildim ancak section2'yi çekmeye çalıştığımda bazı chapterları
  atladığını gördüm(8-9)
    8.Chapterı tek başına çekmeye çalıştığımda çekti dolayısıyla chapterlara bir şey yapmam gerekiyor . Ya her chapterdan sonra 
    sayfayı yenileyip üzerinde olunması gereken sectionu açtıracağım ya da chaptera basıldığında ilk headinginin yüklenip yüklenmediğini
    kontrol ettireceğim . Birinci olursa daha kolay olur çünkü ikinci olursa bu sefer data döngüsünden önce headinge bastırdığım kısma
    bir şeyler yapmam gerekecek
  */
  /* Sectionun verisini alıyorum :  */
  for (let sectionCounter = 2; sectionCounter < 3; sectionCounter++) {
    let sectionArray = []
    const [sectionHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[1]/span[1]`)
    const [sectionContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[1]/div/h2`)
    if (sectionHeader && sectionContent) { //okuyamadığı zaman undefined dönüyor
      const sectionHeaderContent = await sectionHeader.getProperty('textContent')
      const sectionHeaderText = await sectionHeaderContent.jsonValue()

      const sectionContentContent = await sectionContent.getProperty('textContent')
      const sectionContentText = await sectionContentContent.jsonValue()

      sectionArray.push(`${sectionHeaderText} - ${sectionContentText}|`)

      console.log(`${sectionHeaderText}-${sectionContentText} alındı .`)

    }
    else if(sectionHeader===undefined || sectionContent===undefined ){
      console.log(`${sectionCounter}.Section çekilemedi döngü başa sarıyor .`)
      sectionCounter-=1
      continue
    }

    /*   Section verisini aldık şimdi Section'a tıklayalım ve chapterın verinisi alalım :   */
    await click(page, `body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})` ) 

    let chapterKonrol = 0
    for (let chapterCounter = 2;  ; chapterCounter++) {
      const [chapterHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[1]/span[1]`)
      const [chapterContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[1]/div/h2`)

      if (chapterHeader && chapterContent) { 
        const chapterHeaderContent = await chapterHeader.getProperty('textContent')
        const chapterHeaderText = await chapterHeaderContent.jsonValue()

        const chapterContentContent = await chapterContent.getProperty('textContent')
        const chapterContentText = await chapterContentContent.jsonValue()

        sectionArray.push(`${chapterHeaderText} - ${chapterContentText}|`)

        console.log(`${chapterHeaderText} - ${chapterContentText} alındı .`)

      }
      else if(chapterHeader===undefined || chapterContent===undefined){
        if(chapterKonrol>2){
          break  
        }
        else{
          console.log('CHAPTERI ÇEKEMEDİ')
          await page.waitForTimeout(5000)
          chapterCounter-=1
          chapterKonrol++
          continue
        }
      }
      /* Chapterın verisini aldık  , şimdi Chapter'a tıklayıp headingin verisini alalım  : */
      await click(page,`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})`)
      let headingKontrol = 0
      for (let headingCounter = 2 ; ; headingCounter++) {
        const [headingHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/span[1]`)
        const [headingContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/div/h2`)

        if (headingHeader && headingContent) { 
          const headingHeaderContent = await headingHeader.getProperty('textContent')
          const headingHeaderText = await headingHeaderContent.jsonValue()

          const headingContentContent = await headingContent.getProperty('textContent')
          const headingContentText = await headingContentContent.jsonValue()

          sectionArray.push(`${headingHeaderText} - ${headingContentText}|`)

          console.log(`${headingHeaderText} - ${headingContentText} alındı .`)

        }
        else if(headingHeader===undefined || headingContent===undefined){
          if(headingKontrol>3){
            break  
          }
          else{
            await page.waitForTimeout(5000)
            headingCounter-=1
            headingKontrol++
            continue
          }
        }
        if (headingHeader == '[deleted]') {
          break
        }
        /* Headingin verisi aldık , şimdi headinge tıklayıp ilgili headingdeki tüm veriyi alalım */
        await click(page,`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})`)
        /* -------------------------------------------------------------------------------------- */
        let dataLength = await getDataLength(page,sectionCounter,chapterCounter,headingCounter)
        /* -------------------------------------------------------------------------------------- */
        let dataKontrol = 0
        for (let dataCounter = 2; dataCounter<dataLength; dataCounter++) {
          // console.log(`${sectionCounter}.Section , ${chapterCounter-1}.Chapter , ${headingCounter-1}.Heading Data Uzunlulu : ${dataLength-2} `)
          const [dataHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[2]/div[${dataCounter}]/div[1]/span[1]`)
          const [dataContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[2]/div[${dataCounter}]/div[1]/div/h2`)
          if (dataHeader && dataContent) { 
            const dataHeaderContent = await dataHeader.getProperty('textContent')
            const dataHeaderText = await dataHeaderContent.jsonValue()

            const dataContentContent = await dataContent.getProperty('textContent')
            const dataContentText = await dataContentContent.jsonValue()

            sectionArray.push(`${dataHeaderText} - ${dataContentText}|`)

            console.log(`${dataHeaderText}-${dataContentText} alındı .`)

          }
          else if(dataHeader===undefined && dataContent===undefined){
            if(dataKontrol>3){
              break  
            }
            else{
              dataKontrol++
            }
          }
        }
      }
    }
    fs.writeFile('veriler.txt',sectionArray.toString(),{flag:'a+'} ,(err, data) => {
      if (err) throw err;
        console.log('Veri başarıyla yazıldı.');
    });
  }
  await browser.close();
  console.log('\n-----Bitti-----\n')
  let endTime = performance.now()
  console.log(`Çalışma Süresi : ${((endTime - startTime)/1000).toFixed(3)} saniye ,  ${((endTime - startTime)/1000/60).toFixed(3)} dakika`)
})();





/*
body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(2) > div.sub-items-holder.sectionIsOpend > div:nth-child(3)
body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(2) > div.sub-items-holder.sectionIsOpend > div:nth-child(4)
*/