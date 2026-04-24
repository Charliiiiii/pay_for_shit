const QUOTES = [
  '蹲下不是偷懒，是拿回属于我的剩余价值',
  '今天又是血赚的一天',
  '这是在执行无产阶级财富再分配',
  '腿已麻，心已飞',
  '再蹲一会儿，午饭钱就出来了',
  '腿已麻，心已飞',
  '已经赚到一杯蜜雪冰城了，撤！',
  '蹲出个早餐，蹲出个尊严',
  '属于打工人的微型退休仪式',
  '这里没有OKR，只有OK的噗噗'
]

function randomQuote() {
  const i = Math.floor(Math.random() * QUOTES.length)
  return QUOTES[i]
}

module.exports = { QUOTES, randomQuote }
