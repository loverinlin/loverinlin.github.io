import { tabList, cmdtList } from './dataList.js'

const content = document.querySelector('#tab__content');
const getSessionTab = sessionStorage.getItem('tabId')
const getTabData = (item, type) => {
  const getTabData = tabList.find(tabData => tabData.tab === item.tab)
  return getTabData
}

const tabs = document.querySelectorAll('.tab')
if (sessionStorage.getItem('tabId')) {

}
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const cmdtItems = document.querySelectorAll('.cmdtItem')
    const target = tab.dataset.tab
    tabs.forEach((item) => { item.classList.remove('active') })
    tab.classList.add('active')
    sessionStorage.setItem('tabId', target);
    if (target === '0') {
      cmdtItems.forEach((item) => item.classList.add('active'))
    }
    else {
      cmdtItems.forEach((item) => { item.classList.remove('active') })
      const targetContents = document.querySelectorAll(`[data-content="${target}"]`)
      targetContents.forEach((item) => { item.classList.add('active') })
    }
  })
})
cmdtList.forEach(item => {
  content.innerHTML += `
  <div class="cmdtItem active ${getTabData(item).color}"  data-content="${item.tab}">
    <div class="cmdtItem__tag">${getTabData(item).title}</div>
      <div class="cmdtItem__content">
        <div class="cmdtItem__img"><img src=${item.imgUrl}></div>
        <div class="cmdtItem__title">${item.cmdtName}</div>
        <a href="../cmdtInfo.html?cmdtName=${encodeURIComponent(item.cmdtName)}" class="cmdtItem__btn">查看詳情</a>
    </div>
  </div>
  `;
});
