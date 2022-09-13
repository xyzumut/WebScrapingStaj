const chapterRestartTime = 2500
const reloadHeadingTime = 1000

const puppeteer = require('puppeteer');
const fs = require('fs');

const getSectionLength = async (page,sectionCounter) => {
  for (let index = 0; index < 4; index++) {
    let chaptersLength = 0 
    try {
      await page.waitForTimeout(1500+(500*index))
      let chaptersLoadingControl = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})` , 
      element => element.children[1].children[1].getAttribute('class'))
      if (chaptersLoadingControl=='nomenclature-item chapter-item') {
      //itemler yüklenmiş demektir 
      chaptersLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})` , 
      element => element.children[1].children.length+1)
      return chaptersLength
    }
      else{
        await reloadSection(page,sectionCounter)
      }
    } 
    catch (error) {
      await reloadSection(page,sectionCounter)
    }
  }
}
const reloadSection = async (page,sectionCounter) => {
  await page.waitForTimeout(1000)
  await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  await page.waitForTimeout(1000)
  await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})`)
}
const getChapterLength = async(page,sectionCounter,chapterCounter) => {
  for (let index = 0; index < 3; index++) {
    let headingsLength = 0 
    try {
      await page.waitForTimeout(1000)
      let chaptersLoadingControl = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})` , 
      element => element.children[1].children[1].getAttribute('class'))
      if (chaptersLoadingControl=='nomenclature-item heading-item' || chaptersLoadingControl=='nomenclature-item subchapter-item') {
        //itemler yüklenmiş demektir 
        headingsLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})` , 
        element => element.children[1].children.length+1)
        return headingsLength
      }
      else{
        await reloadChapter(page,sectionCounter,chapterCounter)
      }
    } 
    catch (error) {
      await reloadChapter(page,sectionCounter,chapterCounter)
    }
  }
}
const reloadChapter = async (page,sectionCounter,chapterCounter) => {
  await page.waitForTimeout(1000)
  await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  await page.waitForTimeout(1000)
  await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})`)
  await page.waitForTimeout(1000)
  await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})`)
}
const getHeadingLength = async(page,sectionCounter,chapterCounter,headingCounter) => {
  for (let index = 0; index < 3; index++) {
    await page.waitForTimeout(1000+index*100)  
    let headingsLength = 0 
    try {
      let [element] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/div/h2`)
      let elementContent = await element.getProperty('textContent')
      let elementText = await elementContent.jsonValue()
      if (
        elementText == '[deleted]' || 
        elementText =='PRIMARY FORMS' || 
        elementText=='WASTE, PARINGS AND SCRAP; SEMI-MANUFACTURES; ARTICLES'||
        elementText=='MISCELLANEOUS'||
        elementText=='INORGANIC BASES AND OXIDES, HYDROXIDES AND PEROXIDES OF METAL'||
        elementText=='HALOGEN OR SULPHUR COMPOUNDS OF NON‑METALS'||
        elementText=='INORGANIC ACIDS AND INORGANIC OXYGEN COMPOUNDS OF NON‑METALS'||
        elementText=='SALTS AND PEROXYSALTS, OF INORGANIC ACIDS AND METALS'||
        elementText=='CHEMICAL ELEMENTS'
        ) {
        return 0
      }
      let headingsLoadingControl = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})` , 
      element => element.children[1].children[1].getAttribute('class'))
      if (headingsLoadingControl=='nomenclature-item subheading-item' || headingsLoadingControl.includes('nomenclature-item subheading-item') ) {
        headingsLength = await page.$eval(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})` , 
        element => element.children[1].children.length+1)
        return headingsLength
      }
      else{
        await reloadHeading(page,sectionCounter,chapterCounter,headingCounter,index)
      }
    } 
    catch (error) {
      await reloadHeading(page,sectionCounter,chapterCounter,headingCounter,index)
    }
  }
  return 0
}

const reloadHeading = async (page,sectionCounter,chapterCounter,headingCounter,index) => {
  await page.waitForTimeout(reloadHeadingTime+reloadHeadingTime*index)
  await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
  await page.waitForTimeout(reloadHeadingTime+reloadHeadingTime*index)
  await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})`)
  await page.waitForTimeout(reloadHeadingTime+reloadHeadingTime*index)
  await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})`)
  await page.waitForTimeout(reloadHeadingTime+reloadHeadingTime*index)
  await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})`)
  await page.waitForTimeout(reloadHeadingTime+reloadHeadingTime*index)
}

(async () => {
  let startTime = performance.now()
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--window-size=1200,10000']
  });
  
  const page = await browser.newPage();
  await page.goto('https://www.wcotradetools.org/en/harmonized-system');
  for (let sectionCounter = 1; sectionCounter < 2; sectionCounter++) {
    const [sectionHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[1]/span[1]`)
    const [sectionContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[1]/div/h2`)

    const sectionHeaderContent = await sectionHeader.getProperty('textContent')
    const sectionHeaderText = await sectionHeaderContent.jsonValue()

    const sectionContentContent = await sectionContent.getProperty('textContent')
    const sectionContentText = await sectionContentContent.jsonValue()

    console.log((`${sectionHeaderText} - ${sectionContentText} alındı`))
    fs.writeFile('gtip.txt',`\n${sectionHeaderText}|${sectionContentText}`,{flag:'a+'} ,(err, data) => {
      if (err) throw err;
    });
    await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})`)

    let sectionLength = await getSectionLength(page,sectionCounter)

    for (let chapterCounter = 2 ; chapterCounter < sectionLength; chapterCounter++) {
        if (chapterCounter>2) {
          await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
          await page.waitForTimeout(chapterRestartTime)
          await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter})`)
          await page.waitForTimeout(chapterRestartTime)
        }
        const [chapterHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[1]/span[1]`)
        const [chapterContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[1]/div/h2`)

        const chapterHeaderContent = await chapterHeader.getProperty('textContent')
        const chapterHeaderText = await chapterHeaderContent.jsonValue()

        const chapterContentContent = await chapterContent.getProperty('textContent')
        const chapterContentText = await chapterContentContent.jsonValue()

        console.log((`${chapterHeaderText} - ${chapterContentText} alındı`))
        fs.writeFile('gtip.txt',`\n${chapterHeaderText}|${chapterContentText}`,{flag:'a+'} ,(err, data) => {
          if (err) throw err;
        });
        await page.waitForTimeout(1000)
        await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter})`)
        
        let chapterLength = await getChapterLength(page,sectionCounter,chapterCounter)//
        
        for (let headingCounter = 2; headingCounter < chapterLength; headingCounter++) {

            const [headingHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/span[1]`)
            const [headingContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[1]/div/h2`)
    
            const headingHeaderContent = await headingHeader.getProperty('textContent')
            const headingHeaderText = await headingHeaderContent.jsonValue()
    
            const headingContentContent = await headingContent.getProperty('textContent')
            const headingContentText = await headingContentContent.jsonValue()
    
            console.log((`${headingHeaderText} - ${headingContentText} alındı`))
            fs.writeFile('gtip.txt',`\n${headingHeaderText}|${headingContentText}`,{flag:'a+'} ,(err, data) => {
              if (err) throw err;
            });
            await page.waitForTimeout(500)
            await page.click(`body > div.dialog-off-canvas-main-canvas > div.wrapper > section > section > div:nth-child(${sectionCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${chapterCounter}) > div.sub-items-holder.sectionIsOpend > div:nth-child(${headingCounter})`)
            
            let headingLength = await getHeadingLength(page,sectionCounter,chapterCounter,headingCounter)
            
            for (let dataCounter = 2; dataCounter < headingLength; dataCounter++) {

                const [dataHeader] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[2]/div[${dataCounter}]/div[1]/span[1]`)
                const [dataContent] = await page.$x(`/html/body/div[1]/div[1]/section/section/div[${sectionCounter}]/div[2]/div[${chapterCounter}]/div[2]/div[${headingCounter}]/div[2]/div[${dataCounter}]/div[1]/div/h2`)
        
                const dataHeaderContent = await dataHeader.getProperty('textContent')
                const dataHeaderText = await dataHeaderContent.jsonValue()
        
                const dataContentContent = await dataContent.getProperty('textContent')
                const dataContentText = await dataContentContent.jsonValue()
        
                console.log((`${dataHeaderText} - ${dataContentText} alındı`))
                fs.writeFile('gtip.txt',`\n${dataHeaderText}|${dataContentText}`,{flag:'a+'} ,(err, data) => {
                  if (err) throw err;
                });
            }
        }
    }
    
  }

  
  await browser.close();
  console.log('\n-----Bitti-----\n')
  let endTime = performance.now()
  console.log(`Çalışma Süresi : ${((endTime - startTime)/1000).toFixed(3)} saniye ,  ${((endTime - startTime)/1000/60).toFixed(3)} dakika`)
})();