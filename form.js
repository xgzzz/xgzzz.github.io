
/*js的导入方式是
*
* <script src=""></script>
*
* <link href=""> 这是css代码导入方式
*
* 不要在记混了
* */

function getLength(str) {
   return str.replace(/[^\x00-\xff]/g,'xx').length;// [\x00-\xff]单字节区间 [^\x00-\xff] 取反就是双字节
}                                                      //用xx代替双字节 如汉字是双字节 用xx代替一个汉字
//判断字符是否相等
function findStr(str,n) {
    var temp=0;
    for(var i=0;i<str.length;i++){
    if(str.charAt(i)==n){
        temp++;
    }
    }
    return temp;
}
  window.onload=function () {
    //获取三个文本框元素
      var aInput=document.getElementsByTagName('input');
      var oName=aInput[0];
      var pwd=aInput[1];
      var pwd2=aInput[2];
      //获取三个隐藏元素
    var aP=document.getElementsByTagName('p');
    var name_msg=aP[0];
    var pwd_msg=aP[1];
    var pwd2_msg=aP[2];
    var aEm=document.getElementsByTagName('em');
    var oCount=document.getElementById('count');
    var name_length=0;   //定义一个全局变量
    //    用户名可以是汉字，字母，数字，下划线
    //   \u4e00-\u9fa5  汉字区间
       // 获得焦点
         oName.onfocus=function () {
             name_msg.style.display="block";
             name_msg.innerHTML='<i class="ati"></i>6~18个字符，可使用字母、数字、下划线，需以字母开头';
        };
      //输入内容
      oName.onkeyup=function () {
          oCount.style.display='block';
          name_length=getLength(this.value);
      oCount.innerHTML=name_length+"个字符";
      if(name_length==0){
          oCount.style.display='none';  //若长度为0 则隐藏
      }
    };
    //失去焦点
      oName.onblur=function () {
          oCount.style.display='none';
           //不能含有非法字符
          var pattern=/[^\w\u4e00-\u9fa5]/g;  // 非数字、字母、下划线和汉字
          if (pattern.test(this.value)){
              name_msg.innerHTML='<i class="err"></i>含有非法字符';
          }
          //不能为空
          else if(this.value==''){
              name_msg.innerHTML='<i class="err"></i>不能为空';
          }
          //长度不能超过18
          else if(this.value.length>25){
              name_msg.innerHTML='<i class="err"></i>超出长度范围';
          }
          //长度不能少于6个
          else if(this.value.length<6){
              name_msg.innerHTML='<i class="err"></i>长度不能少于6';
          }
          else {
              name_msg.innerHTML='<i class="ok"></i>ok';
          }
    };

    //密码框
      pwd.onfocus=function () {
          pwd_msg.style.display='block';
          pwd_msg.innerHTML='<i class="ati"></i>6-16个字节，请使用字母数字和符号的组合形式，不能那个单独使用'
      };
      pwd.onkeyup=function () {
        //超过6个 算“中”
          if(this.value.length>6){
             aEm[1].className='active';
             pwd2.removeAttribute("disabled",null);  //去掉disable属性
             pwd2_msg.style.display='block';
          }
          else {
              aEm[1].className='';
              pwd2.setAttribute('disabled','disabled');  //去掉disable属性
              pwd2_msg.style.display="none";
         //    setAttribute 的用法是 element.setAttribute(attributename,attributevalue)
         //    removeAttribute("style")  方法删除指定的属性。
          }
        //超过10个算“强”
          if(this.value.length>10){
              aEm[2].className='active';
          }
          else {
              aEm[2].className='';
          }
      };
      pwd.onblur=function () {
          //不能为空
          var pattern1=/[^\d]/g;  //非数字
          var pattern2=/[^a-zA-Z]/g;  //非数字
          var m=findStr(pwd.value,pwd.value[0]);
          if(this.value==''){
              pwd_msg.innerHTML='<i class="ati"></i>不能为空';
          }
          //不能用相同字符 表示都是同一个字符如ggggggg
          else if(m==this.value.length){
              pwd_msg.innerHTML='<i class="ati"></i>不能用相同字符';
          }
          //长度在6-16之间  this.value.length>6||this.value.length<16
else if(!(this.value.length>6&&this.value.length<16)){   //!(this.value.length>6&&this.value.length<16)都行
              pwd_msg.innerHTML='<i class="ati"></i>长度在6-16之间';
          }
          //不能全是数字

          else if(!pattern1.test(this.value))
          {
              pwd_msg.innerHTML='不能全是数字';
          }
          //不能全是字母
          else if(!pattern2.test(this.value))
          {
              pwd_msg.innerHTML='不能全是字母';
          }
          //ok
else {
              pwd_msg.innerHTML='ok';
          }
      };

      pwd2.onblur=function () {
          if(this.value!=pwd.value){
              pwd2_msg.innerHTML='两次输入密码不一致';
          }
          else {
              pwd2_msg.innerHTML='OK';
          }
      };

  };


