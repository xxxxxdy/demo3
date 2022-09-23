<template>
    <div class="toolbar" @mousemove="updateShowData" @mouseup="typeZero" >
        <div class="toolbar-title">
            <h2>barcode curve</h2>
        </div>

        <div id="option"> dataset
            <select class="dataset" @change="changeDatas">
                <option>test</option>
                <option>covid19</option>
                <option>用电量</option>
                <option>汇率</option>
                <option>太阳能</option>
                <option>交通</option>
                <option>自定义</option>    
            </select>
            <input type="file" id="filename" @change="inputDatas" style="display:none"/>
        </div>

        <div class="toolbar-params">
            <div class="hide">
                <h4>Parameters</h4>
                <ul>
                    <li class="tooltip-element"> y-axis
                        <div></div>
                        <input type="text" value="0" id="low-text"  
                        @mousedown="typeLow"
                        @change="changeText"/>
                        :
                        <input type="text" value="100" id="high-text" 
                        @mousedown="typeHigh"
                        @change="changeText"/>
                    </li>
                    <li> sampling
                        <input type="text" value="1" id="step"
                        @change="changeText"/>
                    </li>
                    <li class="tooltip-element">normalize
                        <label class="switch">
                            <input type="checkbox" checked>
                            <div class="slider round"></div>
                        </label>
                    </li>

                    
                </ul>
            </div> 
        </div>
    </div>
    
</template>

<style scoped>

.toolbar{
    height: 100%;
    width: 100%;
}

.toolbar-title h2 {
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 2rem;
    font-weight: 600px;
    font-size: 1.6rem;
    margin-bottom: 20px;
}

#option{
    width: 200px;
    height: 1.5rem;
    margin-left: 2.5rem;
    margin-top:2rem;
    align-content: center;
}

#option select{
    border: 1px solid #cccccc;
    outline: none;
    width: 120px;
    height: 100%;
    margin-left: 10px;
/*  appearance: none; */
/*  -webkit-appearance: none; */
/*  -moz-appearance: none; */
    padding-left: 20px;
    border-radius: 5px;
    position:relative;
}

.toolbar-params {
    margin-left: 1rem;
}

input[type="text"]{
    width: 3rem;
    height: 1.2rem;
    margin-left: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
}

.switch {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 18px;
    margin-top: 10px;
    margin-left: 10px;
}

.switch input {display:none;}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
}

input:checked + .slider {
    background-color: #2196F3;
}

input:checked + .slider:before {
    -webkit-transform: translateX(12px);
    -ms-transform: translateX(12px);
    transform: translateX(12px);
}

/* Rounded sliders */
.slider.round {
    border-radius: 18px;
}

.slider.round:before {
    border-radius: 50%;
}

</style>

<script>
import bus from '../utils/eventBus'
export default{
    data(){
        return{
            max_data_type: 50,
            max_data_length: 3000,
            y_lower: 0,
            y_upper: 1,
            file: null, 
            inputfile: null,
            low_text: null,
            high_text: null,
            step: null,
            domain: 100,
            caculate_type: 0,
            base_pos:233,
            data_register: 0,
        }
    },

    methods:{

        /* input 读取文件 */
        readTxtFile(filename, callback){
            let max_data_type = this.max_data_type;
            let max_data_length = this.max_data_length;
            var reader = new FileReader();
            reader.readAsText(filename);
            reader.onload = function(e){
                var content = e.target.result;
                datas.splice(0, datas.length);
                var datalist = content.split("\n");

                for(let i=0; i<datalist.length; i++){
                    if(i >= max_data_length) break;
                    if(datalist[i].length < 1) continue;
                    var data_each = datalist[i].split(",");
                    // 非字符串的数字
                    if(Number(data_each[0])!==Number(data_each[0])){
                        var data_time = [data_each[0]];
                        data_time.push.apply(data_time, data_each.slice(1, max_data_type+1).map(Number));
                        datas.push(data_time);
                    }
                    else
                        datas.push(data_each.slice(0, max_data_type+1).map(Number));
                }
                // console.log(datas);
                callback();
            }
        },

        /* XML 读取文件 */
        readLocalFile(filename, callback){
            let max_data_type = this.max_data_type;
            let max_data_length = this.max_data_length;
            var xhr;
            if(window.XMLHttpRequest){
                xhr = new XMLHttpRequest();
            }
            else{
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
            xhr.open("GET",filename, true);
            xhr.overrideMimeType("text/html;charset=utf-8");
            xhr.send(null);
            xhr.onload = function(){
                if(xhr.status === 200){
                    var content = xhr.responseText;
                    datas.splice(0, datas.length);
                    var datalist = content.split("\n");

                    for(let i=0; i< datalist.length; i++){
                        if(i >= max_data_length) break;
                        if(datalist[i].length < 1) continue;

                        var data_each = datalist[i].split(",");
                        // 非字符串的数字
                        if(Number(data_each[0])!==Number(data_each[0])){
                            var data_time = [data_each[0]];
                            data_time.push.apply(data_time, data_each.slice(1, max_data_type+1).map(Number));
                            datas.push(data_time);
                        }
                        else
                            datas.push(data_each.slice(0, max_data_type+1).map(Number));
                    }
                    callback();
                }
            }
        },

        /* 自定义文件的输入 */
        inputDatas(){
            var filelist = this.inputfile.files;
            if(filelist.length === 0) return;
            this.readTxtFile(filelist[0], function(){
                bus.emit("updateData", null);
            });
        },

        /* 文件的选取 */
        changeDatas(){
            if(this.file.value === this.file.options[this.file.length-1].value){
                this.inputfile.click();
                this.file.value = null;
            }
            else if(this.file.value === this.file.options[1].value){
                this.readLocalFile("./data/covid19.txt", function(){
                    bus.emit("updateData", null);
                });
            }
            else if(this.file.value === this.file.options[2].value){
                this.readLocalFile("./data/ele.txt", function(){
                    bus.emit("updateData", null);
                });
            }
            else if(this.file.value === this.file.options[3].value){
                this.readLocalFile("./data/exchange.txt", function(){
                    bus.emit("updateData", null);
                });
            }
            else if(this.file.value === this.file.options[4].value){
                this.readLocalFile("./data/solar.txt", function(){
                    bus.emit("updateData", null);
                });
            }
            else if(this.file.value === this.file.options[5].value){
                this.readLocalFile("./data/traffic.txt", function(){
                    bus.emit("updateData", null);
                });
            }
        },

        /* 高贵的文字框进度条 */
        /* 要不是默认的进度条卡的跟狗屎一样我才懒得写 */

        changeText(){
            bus.emit("updatePersistent", {
                step: Number(this.step.value),
                lower: Number(this.low_text.value),
                upper: Number(this.high_text.value),
            })
        },
        updateShowData(event){
            if(this.caculate_type === 0) return;

            let y_offset = event.pageY - this.base_pos;
            if(this.caculate_type === 1){
                let new_low = this.data_register + y_offset/1000*this.domain;
                if(new_low < 0) this.low_text.value = 0;
                else if(new_low > Number(this.high_text.value)) this.low_text.value = this.high_text.value;
                else this.low_text.value = new_low;
            }
            else if(this.caculate_type === 2){
                let new_high = this.data_register + y_offset/1000*this.domain;
                if(new_high < Number(this.low_text.value)) this.high_text.value = this.low_text.value;
                else if(new_high > this.domain) this.high_text.value = this.domain;
                else this.high_text.value = new_high;
            }
        },
        typeZero(event){
            if(this.caculate_type!== 0) this.changeText();
            this.caculate_type = 0;
        },
        typeLow(event){
            this.data_register = Number(this.low_text.value);
            this.caculate_type = 1;
        },
        typeHigh(event){
            this.data_register =  Number(this.high_text.value);
            this.caculate_type = 2;
        }


    },

    created(){
        bus.on('updateDomain', msg=>{
            this.low_text.value = 0;
            this.high_text.value = msg.y;
            this.domain = msg.y;
            this.step.value = 1;
        })
    },

    mounted(){
        this.file = document.querySelector(".dataset");
        this.inputfile = document.getElementById("filename");
        this.low_text = document.getElementById("low-text");
        this.high_text = document.getElementById("high-text");
        this.step = document.getElementById("step");
        this.base_pos = this.low_text.offsetTop;
    }
}

</script>
