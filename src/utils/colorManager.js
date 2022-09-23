var lower_color = {r:255, g:255, b:255};
var upper_color = {r:255, g:0, b:0}; 

export function getColorInterpolation(partical){
    let color = {
        r: parseInt(lower_color.r - partical*(lower_color.r - upper_color.r)),
        g: parseInt(lower_color.g - partical*(lower_color.g - upper_color.g)),
        b: parseInt(lower_color.b - partical*(lower_color.b - upper_color.b))
    };

    return "rgb("+color.r+","+color.g+","+color.b+")";
}

export function randomColor(){
    let color = {
        r: parseInt(Math.random()*255),
        g: parseInt(Math.random()*255),
        b: parseInt(Math.random()*255)
    };
    return "rgb("+color.r+","+color.g+","+color.b+")";
}