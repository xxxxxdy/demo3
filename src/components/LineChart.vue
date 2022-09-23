<template>
    <div>
    <!--div  @mousemove="drawMouseMoving" @mouseleave="clearMoving"-->
        <svg id="linesvg" ></svg>
    </div>
</template>

<style scoped>
    div{
        height: 100%;
        width:100%;
    }
    svg{
        height: 100%;
        width:100%;
    }
    
</style>

<script>
import * as d3 from 'd3';
import bus from '../utils/eventBus'

const line_margin = { top:30, right:30, bottom:30, left:50 };
var line_svg;
var line_g;
var line_svg_dynamic;
var line_g_dynamic;
var parseData = d3.timeParse("%m/%d/%Y");
var xScale;
var yScale;
var normalize = false;

export default{
    data(){
        return{
            line_width: 0,
            line_height: 0,
            min_time: 0,
            max_time: 1,
            min_value: 0,
            max_value: 1,
            max_diff: 1,
            left_canvas_pos: 0,
            top_canvas_pos: 0,
            x_domain: 1,
            y_domain: 1,
        }
    },

    methods:{
        clear(){
            line_g.selectAll("*").remove();
            line_g_dynamic.selectAll("*").remove();
        },

        drawScale(){
            if(Number(datas[0][0])!== Number(datas[0][0])){
                datas.forEach(element => {
                    element[0] = parseData(element[0]);
                });
                this.min_time = d3.min(datas, item => item[0]);
                this.max_time = d3.max(datas, item => item[0]);
                this.x_domain = this.max_time - this.min_time;
                xScale = d3.scaleTime().range([0, this.line_width])
                    .domain([this.min_time, this.max_time]);
                // xScale = d3.scaleTime().range([0, this.line_width])
                //     .domain(d3.extent(datas, function(d) {
                //         return d[0];
                //     }));
            }
            else{
                this.min_time = d3.min(datas, item => item[0]);
                this.max_time = d3.max(datas, item => item[0]);
                this.x_domain = this.max_time - this.min_time;
                //搬运代码并不可怕，可怕的是搬错了
                xScale = d3.scaleLinear().range([0, this.line_width])
                    .domain([this.min_time, this.max_time]);
            }
            line_g.append("g")
                .attr("transform", 'translate(0, '+ this.line_height +')')
                .call(d3.axisBottom(xScale))
                .attr("stroke", "black");

            yScale = d3.scaleLinear().range([this.line_height, 0]);
            
            if(normalize){
                yScale.domain([0,1]);
            }
            else{
                // 理论上min和max可以在一次循环中搞定，但是我懒得写了
                // 后续如果有优化提速的需求再改
                this.min_value = d3.min(datas, item => item[1]);
                this.max_value = d3.max(datas, item => item[1]);
                this.max_diff = this.max_value - this.min_value;
                for(let i = 2; i<datas[0].length; i++){
                    let min_tmp = d3.min(datas, item => item[i]);
                    let max_tmp = d3.max(datas, item => item[i]);
                    if(min_tmp < this.min_value) this.min_value = min_tmp;
                    if(max_tmp > this.max_value) this.max_value = max_tmp;
                    if(max_tmp - min_tmp > this.max_diff) this.max_diff = max_tmp - min_tmp;
                }
                this.y_domain = this.max_value - this.min_value;
                yScale.domain([this.min_value, this.max_value]);
            }

            
            line_g.append("g")
                .call(d3.axisLeft(yScale))
                .attr("stroke", "black");

            bus.emit('updateDomain',{
                y: this.y_domain
            })
        },

        drawLine(){
            for(let i = 1; i <datas[0].length; i++){
                const lineMapping = d3.line()
                    .x(d => {
                        return xScale(d[0]);
                    })
                    .y(d => {
                        return yScale(d[i]);
                    });
                line_g.append("path")
                    .attr("d", lineMapping(datas))
                    .attr("class", "line") // 用来同时处理一堆线
                    .attr("id", "line_"+i)// 用来处理一条线
                    //航航于此添加两句
                    .attr("fill", "none")
                    .attr("stroke", "#87ceeb"); // sky blue
            }
        },

        drawMouseMoving(event){
            line_g_dynamic.selectAll(".tmpline").remove();
            line_g_dynamic.selectAll(".tmptext").remove();
            let x_pos = event.pageX - this.left_canvas_pos; 
            let y_pos = event.pageY - this.top_canvas_pos;
            if(x_pos < 0 || x_pos > this.line_width ||
                y_pos < 0 || y_pos > this.line_height) return;
            line_g_dynamic.append("line")
                .attr("x1", x_pos)
                .attr("y1", y_pos)
                .attr("x2", x_pos)
                .attr("y2", this.line_height)
                .attr("class", "tmpline")
                .style("stroke-dasharray", "5, 5")
                .style("stroke", "red");
            line_g_dynamic.append("line")
                .attr("x1", x_pos)
                .attr("y1", y_pos)
                .attr("x2", 0)
                .attr("y2", y_pos)
                .attr("class", "tmpline")
                .style("stroke-dasharray", "5, 5")
                .style("stroke", "red");
 
            let x_value = x_pos/this.line_width*this.x_domain+this.min_time;
            let y_value = this.max_value - y_pos/this.line_height*this.y_domain;
            line_g_dynamic.append("text").text(x_value)
                .attr("x", x_pos).attr("y", this.line_height)
                .attr("dx",2).attr("dy", -2)
                .attr("class","tmptext").style("stroke", "red");
            line_g_dynamic.append("text").text(y_value)
                .attr("x", 0).attr("y", y_pos)
                .attr("dx",2).attr("dy", -2)
                .attr("class","tmptext").style("stroke", "red");
        },
        clearMoving(){
            line_g_dynamic.selectAll(".tmpline").remove();
            line_g_dynamic.selectAll(".tmptext").remove();
        }

    },

    created(){
        bus.on('updateData', msg =>{
            this.clear();
            this.drawScale();
            this.drawLine();
        })

        bus.on('highLight', msg =>{

            if(msg.color === null){
                line_g_dynamic.selectAll("._"+ msg.idx).remove();
                return;
            }
            const line_click = d3.line().x(d => {
                return xScale(d[0]);
            })
            .y(d => {
                return yScale(d[Number(msg.idx)+1]);
            });
            line_g_dynamic.append("path")
                .attr("d", line_click(datas))
                .attr("class","_"+msg.idx)
                .attr("fill", "none")
                .attr("stroke-width",2)
                .attr("stroke", msg.color);
        })
    },

    mounted(){
        //航航于此添加两句
        line_svg = d3.select('#linesvg');
        line_g = line_svg.append("g").attr("transform","translate("+line_margin.left+","+line_margin.bottom+")");
        line_g_dynamic = line_svg.append("g").attr("transform","translate("+line_margin.left+","+line_margin.bottom+")");
        this.left_canvas_pos = this.$el.getClientRects()[0].left + line_margin.left;
        this.top_canvas_pos = this.$el.getClientRects()[0].top + line_margin.top;
        let width =  this.$el.getClientRects()[0].width;
        let height = this.$el.getClientRects()[0].height;
        this.line_width = width - line_margin.left - line_margin.right;
        this.line_height = height - line_margin.top - line_margin.bottom;

        this.drawScale();
        this.drawLine();
        // console.log(this.$el.getClientRects()[0]);
      
    }
}

</script>
