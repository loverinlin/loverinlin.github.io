import { nutritionList, cmdtList, tabList } from './dataList.js'

const drisContent = document.querySelector('#dris');
const onceContent = document.querySelector('#once');
const cmdtImg = document.querySelector('#cmdtImg');
const hintContent = document.querySelector('#hintList');
const cmdtData = cmdtList.find(cmdtData => cmdtData.cmdtName === decodeURIComponent(location.search.split('=')[1]))

const onceData = (data) => {
  const validColumns = nutritionList.filter(({ value }) =>
    data[value] !== null &&
    data[value] !== undefined &&
    data[value] !== ''
  )
  if (!validColumns.length) return ''
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>項目</th>
          <th>每份</th>
        </tr>
      </thead>
      <tbody>
        ${validColumns.map(item => `
          <tr>
            <td>${item.label}</td>
            <td>${data[item.value]}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

const drisData = (data, imgUrl) => {
  const contentBlock = document.createElement('div')
  nutritionList.map(item => {
    const value = data[item.value]
    const text = value ? `${value}` : '-'
    const row = document.createElement('div')
    row.classList.add('cmdtInfo__DRIS--row')
    row.innerHTML = `
      <div class="cmdtInfo__DRIS--text" style="min-width: 85px;">${item.label}</div>
      <div class="cmdtInfo__DRIS--text" style="font-weight: bold; min-width: 55px; color: ${item.color};">${text}</div>
      <div class="progress"><div class="progress__bar" style="width: ${text}; background-color: ${item.color};"></div></div>
    `
    contentBlock.appendChild(row)
  })
  return contentBlock.innerHTML
}

cmdtImg.classList.add(tabList.find(tabItem => tabItem.tab === cmdtData.tab)?.color || '')
cmdtImg.innerHTML = `
  <div class="cmdtInfo__block--title flex-center">${cmdtData.cmdtName}</div>
  <div class="cmdtInfo__block--img">
    <img src="${cmdtData.imgUrl}" alt="${cmdtData.cmdtName}">
  </div>
  `

onceContent.innerHTML += `
  <div class="cmdtInfo__block--title">
      營養表示
      <span class="cmdtInfo__block--subTitle">每份${cmdtData.onceCnt}</span>
  </div>
  <div style="padding: 8px;">
    ${onceData(cmdtData.onceData)}
  </div>
`

drisContent.innerHTML += `
  <div class="cmdtInfo__DRIS--row">
    <div class="cmdtInfo__block--title">
      各年齡層DRIS比
      <span class="cmdtInfo__block--subTitle">(依每份${cmdtData.onceCnt}計算)</span>
    </div>
  </div>
  <div class="cmdtInfo__row" style="background-color: #ffffff; padding: 8px 0;">
    <div class="blue cmdtInfo__DRIS">
      <div class="cmdtInfo__DRIS--content">
        <div class="cmdtInfo__DRIS--img">
          <div class="cmdtInfo__DRIS--title">${cmdtData.m51.title}</div>
          <img src='./image/cmdtInfo/m51.webp' alt="${cmdtData.m51.title}">
        </div>
        <div class="cmdtInfo__DRIS--data">${drisData(cmdtData.m51)}</div>
      </div>
    </div>
    <div class="pink cmdtInfo__DRIS">
      <div class="cmdtInfo__DRIS--content">
        <div class="cmdtInfo__DRIS--img">
          <div class="cmdtInfo__DRIS--title">${cmdtData.f51.title}</div>
          <img src='./image/cmdtInfo/f51.webp' alt="${cmdtData.f51.title}">
        </div>
        <div class="cmdtInfo__DRIS--data">${drisData(cmdtData.f51)}</div>
      </div>
    </div>
    <div class="blue cmdtInfo__DRIS">
      <div class="cmdtInfo__DRIS--content">
        <div class="cmdtInfo__DRIS--img">
          <div class="cmdtInfo__DRIS--title">${cmdtData.m71.title}</div>
          <img src='./image/cmdtInfo/m71.webp' alt="${cmdtData.m71.title}">
        </div>
        <div class="cmdtInfo__DRIS--data">${drisData(cmdtData.m71)}</div>
      </div>
    </div>
    <div class="pink cmdtInfo__DRIS">
      <div class="cmdtInfo__DRIS--content">
        <div class="cmdtInfo__DRIS--img">
          <div class="cmdtInfo__DRIS--title">${cmdtData.f71.title}</div>
          <img src='./image/cmdtInfo/f71.webp' alt="${cmdtData.f71.title}">
        </div>
        <div class="cmdtInfo__DRIS--data">${drisData(cmdtData.f71)}</div>
      </div>
    </div>
  </div>
`
hintContent.innerHTML += cmdtData.hintList.map(hint => `<li class="hintBlock__item">${hint}</li>`).join('')
