export function getCriticalValue(datas, idx){

    let lens = datas.length;
    if(lens < 2) return null;

    var critical_max_value = [];
    var critical_min_value = [];

    if(datas[0][idx] < datas[1][idx]){
        critical_min_value.push([datas[0][0], datas[0][idx]]);
    }
    else{
        critical_max_value.push([datas[0][0], datas[0][idx]]);
    }

    for(let i=1; i<lens-1;i++){
        if(datas[i][idx] < datas[i+1][idx]){
            if(datas[i][idx] <= datas[i-1][idx]){
                critical_min_value.push([datas[i][0], datas[i][idx]]);
            }
        }
        else{
            if(datas[i][idx] > datas[i-1][idx]){
                critical_max_value.push([datas[i][0], datas[i][idx]]);
            }
        }
    }

    if(datas[lens-1][idx] <= datas[lens-2][idx]){
        critical_min_value.push([datas[lens-1][0], datas[lens-1][idx]]);
    }
    else{
        critical_max_value.push([datas[lens-1][0], datas[lens-1][idx]]);
    }

    return [critical_max_value, critical_min_value];
        
}


// /* 求极值 */
// 之前写的极大值和极小值分开求的版本，想了想好像没必要分开算
// function getExtremum(datas, idx, flag = false){
//     let lens = datas.length;
//     if(lens < 2) return null;
//     var extre_list = [];
//     if(flag ^ (datas[0][idx] < datas[1][idx])){
//         extre_list.push([datas[0][0], datas[0][idx]])
//     }
//     for(let i=1; i<lens-1;i++){
//         if((flag ^ (datas[i][idx] <= datas[i-1][idx]))
//             && ( flag ^ (datas[i][idx] < datas[i+1][idx]))){
//             extre_list.push([datas[i][0], datas[i][idx]]);
//         }
//     }
//     if(flag ^ (datas[lens-1][idx] <= datas[lens-2][idx])){
//         extre_list.push([datas[lens-1][0], datas[lens-1][idx]])
//     }
//     return extre_list;
// }