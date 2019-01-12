/*我想要的里面没有分页，一次查完了*/
const util = require('../../utils/util.js')
const app = getApp()
const db  = wx.cloud.database()
const _ = db.command
Page({
  data: {
    pageNum: 0,
    count: 5,
    goods: [],
    //物流信息
    //tracesData:null
    openid:wx.getStorageSync("openid")
  },
  /*生命周期事件 开始 */
  onLoad: function (options) {},
  onShow: function () {
    var that = this
    that.setData({
      goods: []
    })
    var openid = that.data.openid
    var _pageNum = that.data.pageNum
    var _count = that.data.count
    var ifLogin = util.checkLogin()
    if (!ifLogin) {
      return
    } else {
      var fromReachBottom = false
      that.queryIBought(openid, _pageNum, _count, fromReachBottom)
    }
  },
  onPullDownRefresh: function () {
    var that = this
    that.setData({
      pageNum: 0
    })
    var openid = that.data.openid
    var _pageNum = that.data.pageNum
    var _count = that.data.count
    var fromReachBottom = false
    that.queryIBought(openid, _pageNum, _count, fromReachBottom)
  },
  onReachBottom: function () {
    var that = this
    that.data.pageNum++
    var openid = that.data.openid
    var _pageNum = that.data.pageNum
    console.log(_pageNum)
    var _count = that.data.count
    var fromReachBottom = true//true则往goods里追加查询数据
    that.queryIBought(openid, _pageNum, _count, fromReachBottom)
  },
  /*生命周期事件 结束 */
  /*自定义事件 开始 */
  queryIBought: function (openid, _pageNum, _count, fromReachBottom) {
    wx.showNavigationBarLoading()
    var that = this
    that.setData({
      tip: "加载中……"
    })
    db.collection("user").where({
      _openid: openid
    })
    .get()
    .then(res => {
      console.log(res)
      var bought_arr = res.data[0].bought
      db.collection("good").where({
        _id: _.in(bought_arr)
      })
      .orderBy('pub_dt', 'desc')
      .skip(_pageNum * _count)
      .limit(_count)
      .get()
      .then(res => {
        console.log(res)
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
        if (res.data.length > 0) {
          if (fromReachBottom) {
            var old_goods = that.data.goods
            that.setData({
              goods: old_goods.concat(res.data)
            })
          } else {
            that.setData({
              goods: res.data
            })
          }
          if (res.data.length < _count) {
            that.setData({
              tip: "到底了(∩_∩)!!"
            })
          }
        } else {
          that.setData({
            tip: "到底了(∩_∩)!!"
          })
        }
      })
      .catch(err => {
        console.log(err)
      })
    })
    .catch(err => {
      console.log(err)
    })
  },
  receiveGoodBtn:function(e){
    var that = this
    var gid = e.currentTarget.dataset.gid
    wx.request({
      url: config.host+'bought.jsp',
      data:{
        oper:"receiveGood",
        gid:gid
      },
      success:function(res){
        console.log(res.data)
        if(res.data.trim() == "确认收货成功"){
          wx.showToast({
            title: '确认收货成功',
            icon:"success",
            duration:618
          })
        }
      },
      fail:function(){

      },
      complete:function(){

      }
    })
  },
  phoneCall: function (e) {
    wx.makePhoneCall({
      phoneNumber: e.target.dataset.phone
    })
  },
  navigateToGoodDetail: function (e) {
    var good = e.currentTarget.dataset.good
    var goodstr = JSON.stringify(good)
    wx.navigateTo({
      url: "/pages/index-good-detail/index-good-detail?good=" + goodstr + "&wanted_png=wanted.png",
    })
  },
  getTraces:function(e){
    var good = e.currentTarget.dataset.good
    var goodstr = JSON.stringify(good)
    wx.navigateTo({
      url: "/pages/transport_query/transport_query?good=" + goodstr
    })
  },
  pay_not_pay:function(e){
    console.log(e)
    var good = e.currentTarget.dataset.good
    var goodstr = JSON.stringify(good)
    var gid = good.id
    var out_trade_no = good.out_trade_no
    var total_fee = good.sell_price
    //支付未支付订单
    var payState = wxpay.pay(gid, out_trade_no, total_fee);
  }
  /*自定义事件 结束 */
})