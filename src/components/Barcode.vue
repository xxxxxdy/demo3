<template>
    <svg id="barsvg"></svg>
</template>

<style scoped>
    #barsvg{
        width:100%;
    }
    
</style>

<script>
import * as d3 from 'd3';
import bus from '../utils/eventBus'
import { getCriticalValue } from '../utils/getCriticalValue'
import { getColorInterpolation, randomColor } from '../utils/colorManager'

const bar_margin = { top:30, right:30, bottom:30, left:30 };
var bar_size = {width: 320, height: 40, padding: 2, margin: 3};
var bar_svg;
var bar_g;
var bar_g_dynamic;

/* 定义一个坡 */
class Slope{
    constructor(top){
        this.top =  top;
        this.left = null;
        this.right = null;
        this.persistent = -1;
    }

    setBottom(bottom_height, left, right){
        this.left = left;
        this.right = right;
        this.persistent = this.top[1] - bottom_height;
    }
}

/* 定义一组生存期数据 */
class Barcode{
    constructor(begin, end){
        this.slope_list = [];
        this.begin = begin;
        this.end = end;
        this.max_y = null; // used to decide color
        this.min_y = null;
        this.draw_list = [];
        this.is_date = false;
    }

    borns(points_list){
        // sort max_point_list by key from lower to higher
        // max_point_list.sort(function(a,b){ return a[0]-b[0]});
        for(let i=0; i<points_list.length; i++){
            this.slope_list.push(new Slope(points_list[i]));
        }
        this.max_y = d3.max(points_list, item => item[1]);
    }

    // 这段代码写的比较抽象，简单来说就是找离坡谷两边最近的坡顶（which still alive）
    // 然后 kill 掉较低的那个坡顶，但是坡要纪录坡底两边的数值，所以就顺便遍历一下剩下的坡谷中
    // 离这个 killed 的坡顶最近的另一边的坡谷（没有就拿起点/终点替代）
    kills(points_list){
        // sort min_point_list by value from higher to lower
        points_list.sort(function(a,b){ return b[1]-a[1]});
        for(let i=0; i<points_list.length; i++){
            let le = -1, ri = -1;
            for(let j=0; j<this.slope_list.length; j++){
                if(this.slope_list[j].persistent === -1){
                    if(this.slope_list[j].top[0] < points_list[i][0]) {
                        le = j;
                    }
                    else{
                        ri = j;
                        break;
                    }
                }
            }
            
            let slope_idx = -1;
            // left_bottom mean the top is in right side (slope_idx === ri)
            let is_left_bottom = true;
            if(le !== -1){
                if(ri !== -1){
                    if(this.slope_list[le].top[1] < this.slope_list[ri].top[1]){
                        slope_idx = le;
                        is_left_bottom = false;
                    }
                    else{
                        slope_idx = ri;
                    }
                }
                else{
                    slope_idx = le;
                    is_left_bottom = false;
                }
            }
            else if(ri !== -1){
                slope_idx = ri;
            }

            if(slope_idx !== -1) {
                if(is_left_bottom){
                    let right_bottom = this.end;
                    for(let k=i+1; k<points_list.length; k++){
                        if((points_list[k][0] > this.slope_list[slope_idx].top[0])
                            && (points_list[k][0]< right_bottom[0]))
                            right_bottom = points_list[k];
                    }
                    this.slope_list[slope_idx].setBottom(points_list[i][1], points_list[i], right_bottom);
                }
                else{
                    let left_bottom = this.begin;
                    for(let k=i+1; k<points_list.length; k++){
                        if((points_list[k][0] < this.slope_list[slope_idx].top[0])
                            && (points_list[k][0] > left_bottom[0]))
                            left_bottom = points_list[k];
                    }
                    this.slope_list[slope_idx].setBottom(points_list[i][1], left_bottom, points_list[i]);
                }
                
            }
            
        }
        this.min_y = points_list[points_list.length-1][1];
    }

    // 有可能出现个没有kill掉的slope，把它给kill掉
    check(mini_point){
        for(let i=0; i<this.slope_list.length; i++){
            if(this.slope_list[i].persistent < 0){
                // console.log(this.slope_list[i]);
                if(this.slope_list[i].top[0] < mini_point[0])
                    this.slope_list[i].setBottom(mini_point[1], this.begin, this.end);
                else
                    this.slope_list[i].setBottom(mini_point[1], this.begin, this.end);
            }
        }
    }

    // 插值
    dataFilling(point_list, step){
        if(point_list.length < 2) return;
    
        this.draw_list.splice(0); //clear
        if(typeof(point_list[0][0]+1) == 'string')
            this.is_date = true;
        let total_dis = this.max_y - this.min_y;
        let now_idx = 0;
        let now_color = (point_list[0][1]-this.min_y)/total_dis;
        let next_color = (point_list[1][1]-this.min_y)/total_dis;

        if(this.is_date){
            for(let x = new Date(point_list[0][0].valueOf()); 
                x < point_list[point_list.length-1][0]; x.setDate(x.getDate()+step)){

                while(x >= point_list[now_idx+1][0]){
                    now_idx ++;
                    now_color = next_color;
                    next_color = (point_list[now_idx+1][1]-this.min_y)/total_dis;
                }
                
                let partical = (x-point_list[now_idx][0])/
                    (point_list[now_idx+1][0]-point_list[now_idx][0]);
                let draw_color = now_color - partical*(now_color - next_color);
                let tmp_date = new Date(x.valueOf());
                this.draw_list.push([tmp_date, draw_color]);
            }
            this.draw_list.push([point_list[point_list.length-1][0], next_color]);
        }
        else{
            for(let x = point_list[0][0]; x < point_list[point_list.length-1][0]; x += step){
                while(x >= point_list[now_idx+1][0]){
                    now_idx ++;
                    now_color = next_color;
                    next_color = (point_list[now_idx+1][1]-this.min_y)/total_dis;
                }
                let partical = (x-point_list[now_idx][0])/
                    (point_list[now_idx+1][0]-point_list[now_idx][0]);

                let draw_color = now_color - partical*(now_color - next_color);
                this.draw_list.push([x, draw_color]);
            }
            this.draw_list.push([point_list[point_list.length-1][0], next_color]);
        }
        // console.log(this.draw_list);
    }

    // step: 一份颜色矩形表示的x区间
    // lower_persistent: 生存期下界
    // upper_persistent: 生存期上界
    updateDrawPoint(step = 1, lower_persistent = 0, upper_persistent = Number.MAX_VALUE){
        let point_list = [this.begin, this.end];
        for(let i=0; i<this.slope_list.length; i++){
            if(this.slope_list[i].persistent >= lower_persistent 
                && this.slope_list[i].persistent <= upper_persistent){
                point_list.push(this.slope_list[i].left);
                point_list.push(this.slope_list[i].top);
                point_list.push(this.slope_list[i].right);
            }
        }
        point_list.sort(function(a, b){ return a[0]-b[0] });
        this.dataFilling(point_list, step);
    }

    // unit_width: 一个单位长度的长度
    // start: 起始点的x值
    // type: html标签， 同时表示第几个barcode
    drawBarcode(unit_width = 1, start = 0,  type = 0, step = 1){   
        // console.log(this.draw_list);
        
        let y = (bar_size.height+2*(bar_size.padding+bar_size.margin))*type;
        
        for(let i = 0; i<this.draw_list.length; i++){
            var wi = unit_width * step;
            if(this.is_date) wi *= 86400000;
            var x = unit_width*(this.draw_list[i][0]-start);

            if(x>bar_size.width || x+wi<0) continue;
            if(x<0) wi += x, x = 0;
            if(x+wi>bar_size.width) wi = bar_size.width - x;

            let color = getColorInterpolation(this.draw_list[i][1]);
            // console.log(color);
            bar_g.append("rect")
                .attr("x",x)
                .attr("y",y)
                .attr("width",wi)
                .attr("height",bar_size.height)
                .attr("fill",color)
                .attr("class", ""+type);
        }

        bar_g.selectAll("rect")
            .on("click", function(d, i){
                const idx = d3.select(this).attr("class");
                let tmp = bar_g_dynamic.selectAll("line._"+idx);
                if(!tmp.empty()) {
                    tmp.remove();
                    bus.emit("highLight", {
                        idx: idx,
                        color: null
                    })
                    return;
                }

                const y_rect = Number(d3.select(this).attr("y"));
                const color = randomColor();
                bar_g_dynamic.append("line")
                    .attr("x1", -bar_size.padding)
                    .attr("y1", y_rect-bar_size.padding)
                    .attr("x2", bar_size.width+bar_size.padding)
                    .attr("y2", y_rect-bar_size.padding)
                    .attr("class", "_"+idx)
                    .style("stroke-width", bar_size.padding)
                    .style("stroke", color);
                bar_g_dynamic.append("line")
                    .attr("x1", -bar_size.padding)
                    .attr("y1", y_rect+bar_size.height+bar_size.padding)
                    .attr("x2", bar_size.width+bar_size.padding)
                    .attr("y2", y_rect+bar_size.height+bar_size.padding)
                    .attr("class", "_"+idx)
                    .style("stroke-width", bar_size.padding)
                    .style("stroke", color);
                bar_g_dynamic.append("line")
                    .attr("x1", -bar_size.padding)
                    .attr("y1", y_rect-bar_size.padding)
                    .attr("x2", -bar_size.padding)
                    .attr("y2", y_rect+bar_size.height+bar_size.padding)
                    .attr("class", "_"+idx)
                    .style("stroke-width", bar_size.padding)
                    .style("stroke", color);
                bar_g_dynamic.append("line")
                    .attr("x1", bar_size.width+bar_size.padding)
                    .attr("y1", y_rect-bar_size.padding)
                    .attr("x2", bar_size.width+bar_size.padding)
                    .attr("y2", y_rect+bar_size.height+bar_size.padding)
                    .attr("class", "_"+idx)
                    .style("stroke-width", bar_size.padding)
                    .style("stroke", color);
                
                bus.emit("highLight", {
                    idx: idx,
                    color: color
                })
            })
    }

    drawSlope(){

    }

}

export default{
    data(){
        return{
            barcode_list: [],
            data_lens: 0, 
            px_unit: 1,
            canvas_height: 1,
        }
    },

    methods:{
        clear(){
            bar_g.selectAll("*").remove();
            bar_g_dynamic.selectAll("*").remove();
        },

        initBarcode(){
            let data_type = datas[0].length, data_length = datas.length;
            this.data_lens = datas[data_length-1][0] - datas[0][0] + 1;
            // this.data_lens = datas[data_length-1][0] - datas[0][0];
            this.px_unit = bar_size.width / this.data_lens;

            for(let i=1; i<data_type; i++){
                let tmp_point_list = getCriticalValue(datas, i);
                let max_point_list = tmp_point_list[0], min_point_list = tmp_point_list[1];
                // console.log(max_point_list, min_point_list);

                let barcode = new Barcode([datas[0][0], datas[0][i]], 
                    [datas[data_length-1][0], datas[data_length-1][i]]);
                
                
                barcode.borns(max_point_list);
                barcode.kills(min_point_list);

                barcode.check(min_point_list[min_point_list.length-1]);

                this.barcode_list.push(barcode);
            }

            let bar_total_height = (data_type-1)*(bar_size.height+2*(bar_size.padding+bar_size.margin));
            if(bar_total_height > this.canvas_height)
                bar_svg.attr("height", bar_total_height+bar_margin.bottom);
            else
                bar_svg.attr("height", this.canvas_height+bar_margin.bottom);
        },

    },

    created(){

        bus.on('updateData', msg =>{
            this.clear();
            this.barcode_list.splice(0);
            this.initBarcode();
            for(let i=0; i<this.barcode_list.length; i++){
                this.barcode_list[i].updateDrawPoint();
                this.barcode_list[i].drawBarcode(this.px_unit, datas[0][0], i);
            }
        })

        bus.on('updatePersistent', msg =>{
            this.clear();
            for(let i=0; i<this.barcode_list.length; i++){
                this.barcode_list[i].updateDrawPoint(msg.step, msg.lower, msg.upper);
                this.barcode_list[i].drawBarcode(this.px_unit, datas[0][0], i, msg.step);
            }
        })

    },

    mounted(){
        bar_svg = d3.select('#barsvg');
        bar_g = bar_svg.append("g").attr("transform","translate("+bar_margin.left+","+bar_margin.bottom+")");
        bar_g_dynamic = bar_svg.append("g").attr("transform","translate("+bar_margin.left+","+bar_margin.bottom+")");
        this.canvas_height = this.$el.getClientRects()[0].bottom;
        this.initBarcode();
        for(let i=0; i<this.barcode_list.length; i++){
            this.barcode_list[i].updateDrawPoint();
            this.barcode_list[i].drawBarcode(this.px_unit, datas[0][0], i);
        }
        
    }
}

</script>
