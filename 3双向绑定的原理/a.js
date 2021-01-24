// vuejs 2.0 才是数据劫持和发布者-订阅者模式实现
//1.通过Object.defineProperty来劫持各个属性的getter setter 
// 2.在数据发生变化的时候，发布消息给订阅者，触发相应的监听回调

//二、Object.defineProperty方法介绍

var obj={
  name:'王菲'
}
Object.defineProperty(obj,'name',{
  get(){
    console.log('我被获取了')
    //return val;
  },
  set(newVal,oldVal){
    console.log('我被设置了',newVal);
  }
})
obj.name='战给';
console.log(obj.name);

function Archiver(){
  var temperature=null;
  var archives=[];
  Object.defineProperty(this,'temperature',{
    get(){
      console.log('被获取了')
      return temperature;
    },
    set(value) {
      temperature = value;
      archives.push({ val: temperature });
    }
  })
  this.getArchive = function() { return archives; };
}

var arc = new Archiver();
arc.temperature; // 'get!'
console.log(arc.temperature)
arc.temperature = 11;
arc.temperature = 13;
arc.getArchive(); // [{ val: 11 }, { val: 13 }]


// 简单粗暴的双向绑定
var map={name:''}
var box=document.querySelector('#box');
var input=document.querySelector('#search');
console.log(box)
console.log(input)
console.log(map)
Object.defineProperty(map,'name',{
  get(){
    console.log('map,我被获取了')
   
  },
  set(val){
    console.log('map:我被设置了');
    box.innerHTML=val;
    input.value=val;
  }
})
console.log(map.name)
map.name='散散'
input.addEventListener('input',(e)=>{
  map.name=e.target.value;
})

map.name='王菲';

/// 讲下Vue的双向绑定
