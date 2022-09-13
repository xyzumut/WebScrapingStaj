const puppeteer = require('puppeteer');
const fs = require('fs');

let datas=[]
async function scrollToBottom(page,_distance) {
  const distance = _distance; // should be less than or equal to window.innerHeight
  const delay = 300;
  while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
    await page.evaluate((y) => { document.scrollingElement.scrollBy(0, y); }, distance);
    await page.waitForTimeout(delay);
  }
  await page.waitForTimeout(3000);
}

const click = async(page,target,waitTime=3000) => {
  await page.waitForTimeout(waitTime)
  await page.click(target)
  await page.waitForTimeout(waitTime)
}

(async () => {
  // const browser = await puppeteer.launch({headless:false});
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--window-size=1200,1600']
  });
  const page = await browser.newPage();
  await page.goto('https://www.wcotradetools.org/en/harmonized-system');
  


  /* Sectionun verisini alıyorum :  */
  for (let sectionCounter = 1; sectionCounter < 2; sectionCounter++) {
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
            scrollToBottom(page,2)
            await page.waitForTimeout(5000)
            headingCounter-=1
            headingKontrol++
            continue
          }
        }
        /* Headingin verisi aldık , şimdi headinge tıklayıp ilgili headingdeki tüm veriyi alalım */
        await click(page,`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})`)
        
        /* -------------------------------------------------------------------------------------- */
        let dataLength = -1000
        for (let index = 0; index < 1; index++) {
          try {
            await page.waitForTimeout(1000)
            await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter}) > div:nth-last-child(1)>div:nth-child(2)`)
            dataLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})` , 
            element => element.children[1].children.length)
            break
          } catch (error) {
            // Eğer Farklı yapıdaki bir heading'e rastlarsa eski usül ilerleyecek
            console.log('eski usül kontrol')
          } 
        }
        
        dataLength = ( dataLength== -1000 ? 100 : dataLength+1 )
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
            dataKontrol=0
          }
          else if(dataHeader===undefined && dataContent===undefined){
            if(dataKontrol>3){
              break  
            }
            else{
              console.log('Girdi@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
              await page.waitForTimeout(5000)
              dataCounter-=1
              dataKontrol++
              scrollToBottom(page,2)
              continue
            }
          }
        }
      }
    }
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    fs.writeFile('veriler.txt',sectionArray.toString(),{flag:'a+'} ,(err, data) => {
      if (err) throw err;
        console.log('Veri başarıyla yazıldı.');
    });
  }
  await browser.close();
  console.log('\n-----Bitti-----\n')
})();