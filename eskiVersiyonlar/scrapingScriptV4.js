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

const click = async(type,page,target) => {
  switch (type) {
    case 'section':
      await page.waitForTimeout(2000)
      await page.click(target)
      await page.waitForTimeout(2000)
      break;
    case 'chapter':
      await page.waitForTimeout(2000)
      await page.click(target)
      await page.waitForTimeout(2000)
      break;
    case 'heading':
      await page.waitForTimeout(3000)
      await page.click(target)
      await page.waitForTimeout(3000)
      break;
    default:
      break;
  }
}

const getDataLength = async (page,section,chapter,heading) => {
  let dataLength = 0 
  try {
      // await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${heading}) > div:nth-last-child(1)>div:nth-child(2)`)
      dataLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${heading})` , 
      element => element.children[1].children.length+1)
  } 
  catch (error) {
    console.log('DATA UZUNLUĞU BULUNAMADI DATA UZUNLUĞU BULUNAMADI')
    console.log(error)
    console.log('DATA UZUNLUĞU BULUNAMADI DATA UZUNLUĞU BULUNAMADI')
  }
  return dataLength;
}


const getChapterLength = async(page,section) => {
  let chapterLength = 0
  try {
    await page.waitForTimeout(1000)
    chapterLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section})` , 
    element => element.children[1].children.length+1)
  } catch (error) {
    console.log('CHAPTER UZUNLUĞU BULUNAMADI CHAPTER UZUNLUĞU BULUNAMADI ')
    console.log(error)
    console.log('CHAPTER UZUNLUĞU BULUNAMADI CHAPTER UZUNLUĞU BULUNAMADI ')
  }
  return chapterLength
}

const getHeadingLength = async(page,section,chapter) => {
  let headingLength = 0
    try {
      await page.waitForTimeout(1000)
      headingLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${section}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapter})` , 
      element => element.children[1].children.length+1)
    } catch (error) {
      console.log('HEADİNG UZUNLUĞU BULUNAMADI HEADİNG UZUNLUĞU BULUNAMADI ')
      console.log(error)
      console.log('HEADİNG UZUNLUĞU BULUNAMADI HEADİNG UZUNLUĞU BULUNAMADI ')
    }
  return headingLength
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
      console.log('@@@ SECTİON\'un verisini okuyamadı @@@')
      break
    }

    /*   Section verisini aldık şimdi Section'a tıklayalım ve chapterın verinisi alalım :   */
    await click('section',page, `body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})` ) 

    let chapterLength = await getChapterLength(page,sectionCounter)
    console.log(`@Chapter uzunluğu :${chapterLength-2}`)
    for (let chapterCounter = 2; chapterCounter < chapterLength ; chapterCounter++) {
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
        console.log('@@@ CHAPTER\'ın verisini okuyamadı @@@')
      }
      /* Chapterın verisini aldık  , şimdi Chapter'a tıklayıp headingin verisini alalım  : */
      await click('chapter',page,`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})`)
      
      let headingLength = await getHeadingLength(page,sectionCounter,chapterCounter)
      console.log(`@Heading uzunluğu :${headingLength-2}`)
      let headingControl = false
      for (let headingCounter = 2 ; headingCounter<headingLength ; headingCounter++) {
        const [headingHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/span[1]`)
        const [headingContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/div/h2`)

        if (headingHeader && headingContent) { 
          const headingHeaderContent = await headingHeader.getProperty('textContent')
          const headingHeaderText = await headingHeaderContent.jsonValue()
          

          const headingContentContent = await headingContent.getProperty('textContent')
          const headingContentText = await headingContentContent.jsonValue()

          sectionArray.push(`${headingHeaderText} - ${headingContentText}|`)

          console.log(`${headingHeaderText} - ${headingContentText} alındı .`)
          if(headingContentText==='[deleted]'){
            // console.log('Deletedi algıladı')
            headingControl = true
          }

        }
        else if(headingHeader===undefined || headingContent===undefined){
          console.log('@@@ HEADİNG\'in verisini okuyamadı @@@')
        }
        if(headingControl){
          headingControl=!headingControl
          continue
        }

        /* Headingin verisi aldık , şimdi headinge tıklayıp ilgili headingdeki tüm veriyi alalım */
        await click('heading',page,`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})`)



        let dataLength = await getDataLength(page,sectionCounter,chapterCounter,headingCounter)
        console.log(`@Data Uzunluğu : ${dataLength} `)        
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
            console.log('DATA\'nın Verisini Okuyamadı')
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
