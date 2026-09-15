const list = [
  {
    index: '01',
    title: '電鍋加熱篇',
    text: '簡單幾步驟<br/>輕鬆加熱好方便!',
    color: '#fe6d6a',
    panelColor: 'pink',
    btnImgUrl: './img/heating/video_pink.png',
    imgUrl: './img/heating/panel__img__1.png',
    videoUrl: 'https://www.facebook.com/share/r/18YLgbfVwu/?mibextid=wwXIfr',
  },
  {
    index: '02',
    title: '隔水加熱篇',
    text: '沒有電鍋沒關係<br/>熱水也能加熱!',
    color: '#257FBD',
    panelColor: 'blue',
    btnImgUrl: './img/heating/video_blue.png',
    imgUrl: './img/heating/panel__img__2.png',
    videoUrl: 'https://www.facebook.com/share/r/1DYQyetbwR/?mibextid=wwXIfr',
  },
  {
    index: '03',
    title: '安全加熱篇',
    text: '最後安全小技巧<br/>一起來看看!',
    color: '#379A5A',
    panelColor: 'green',
    btnImgUrl: './img/heating/video_green.png',
    imgUrl: './img/heating/icon_people--safe.png',
    videoUrl: 'https://www.facebook.com/share/r/1DTjkN24FN/?mibextid=wwXIfr',
  }
]

const content = document.querySelector('#content');
const icon = (item) => {
  return `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="25"
    viewBox="0 0 640 640"
  >
    <circle
      cx="320"
      cy="320"
      r="300"
      fill="#ffffff"
    />

    <g transform="translate(80 80) scale(0.75)">
      <path
        fill="${item.color}"
        d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"
      />
    </g>
  </svg>
`
}

list.forEach(item => {
  content.innerHTML += `
  <div class="${item.panelColor}">
    <div class="panel">
      <div class="panel__content">
        <div class="panel__title__wrap">
          <div class="panel__index">${item.index}</div>
          <div class="panel__title">${item.title}</div>
         </div>
        <div class="panel__text">${item.text}</div>
      </div>
      <a href=${item.videoUrl}>
        <div class="panel__img">
          <img src=${item.imgUrl}>
        </div>
        <div class="panel__video">
          ${icon(item)} <span>立即播放</span>
        </div>
      </a>
      <div class="panel__video--lg">
        <a href=${item.videoUrl}>
          <img src=${item.btnImgUrl}>
        </a>
      </div>
    </div>
  </div>
  `;
});