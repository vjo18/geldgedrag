/* Pure calculation helpers are shared by the page and its verification script. */
(function(root){
  'use strict';
  function compare(rows,keys,start,end,real){
    const subset=rows.filter(r=>r.year>=start&&r.year<=end);
    if(subset.length<2||subset[0].year!==start||subset.at(-1).year!==end)throw new Error('Kies minstens één volledige jaarstap.');
    if(subset.some((r,i)=>i&&r.year!==subset[i-1].year+1))throw new Error('Er ontbreken jaarregels in deze periode.');
    const base=subset[0];
    return keys.map(key=>{
      if(subset.some(r=>!Number.isFinite(r[key])||r[key]<=0||(real&&(!Number.isFinite(r.cpi)||r.cpi<=0))))throw new Error('Deze reeks heeft ontbrekende gegevens in de gekozen periode. Kies een andere periode of reeks.');
      const points=subset.map(r=>({year:r.year,value:100*r[key]/base[key]*(real?base.cpi/r.cpi:1)}));
      if(points.some(p=>!Number.isFinite(p.value)||p.value<=0))throw new Error('Ongeldige jaarwaarde.');
      const steps=points.slice(1).map((p,i)=>(p.value/points[i].value-1)*100);
      return {key,points,end:points.at(-1).value,cagr:(Math.pow(points.at(-1).value/100,1/(end-start))-1)*100,worst:Math.min(...steps),negative:steps.filter(v=>v<0).length,steps:steps.length};
    });
  }
  function ticks(lo,hi,count=5){return Array.from({length:count+1},(_,i)=>lo+(hi-lo)*i/count);}
  const api={compare,ticks};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.GGComparison=api;
})(typeof window!=='undefined'?window:globalThis);
(async function(){
  'use strict';
  if(typeof document==='undefined')return;
  const form=document.querySelector('.history-panel');
  if(!form)return;
  const $=id=>document.getElementById(id),start=$('history-start'),end=$('history-end'),mode=$('history-mode'),scale=$('history-scale');
  let rows;try{rows=await window.GGDataReady;}catch(e){$('history-status').textContent=e.message;return;}
  const labels={equity:'MSCI ACWI IMI',sp:'S&P 500',gold:'Goud',btc:'Bitcoin'},colors={equity:'#355c49',sp:'#426c93',gold:'#a47731',btc:'#795d83'};
  const fmt=(v,d=1)=>v.toLocaleString('nl-BE',{minimumFractionDigits:d,maximumFractionDigits:d});
  const years=rows.map(r=>r.year);let current=[];
  for(const year of years){for(const control of [start,end]){const option=document.createElement('option');option.value=year;option.textContent=year;control.append(option);}}
  start.value=String(years[0]);end.value=String(years.at(-1));
  const svgEl=(name,attrs={},text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
  function chart(series){
    const host=$('history-chart');host.replaceChildren();
    if(!series.length)return;
    const W=960,H=390,L=88,R=24,T=28,B=46,iw=W-L-R,ih=H-T-B;
    const log=scale.value==='log',transform=v=>log?Math.log10(v):v,inverse=v=>log?10**v:v;
    const nums=series.flatMap(s=>s.points.map(p=>transform(p.value)));
    let lo=Math.min(...nums),hi=Math.max(...nums);const pad=(hi-lo||.1)*.12;lo-=pad;hi+=pad;if(!log)lo=Math.min(0,lo);
    const x=year=>L+(year-Number(start.value))/(Number(end.value)-Number(start.value))*iw;
    const y=value=>T+ih-(transform(value)-lo)/(hi-lo)*ih;
    const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-labelledby':'history-chart-title history-chart-desc'});
    svg.append(svgEl('title',{id:'history-chart-title'},'Historische ontwikkeling vanaf index 100'));
    svg.append(svgEl('desc',{id:'history-chart-desc'},`Einde ${start.value} tot einde ${end.value}. ${mode.value==='real'?'Gecorrigeerd voor de aangeleverde Belgische CPI.':'Nominale waarden.'} ${log?'Logaritmische':'Lineaire'} schaal. De jaarwaarden staan ook in de tabel onder de grafiek.`));
    for(const tick of window.GGComparison.ticks(lo,hi)){
      const value=inverse(tick),py=y(value);
      svg.append(svgEl('line',{x1:L,y1:py,x2:W-R,y2:py,stroke:'#d9ddd0'}));
      svg.append(svgEl('text',{x:L-12,y:py+4,'text-anchor':'end',fill:'#6d786e','font-size':12},fmt(value,value<10?1:0)));
    }
    const yearStep=Number(end.value)-Number(start.value)>10?3:2;
    series[0].points.forEach((p,i)=>{if(i%yearStep===0||i===series[0].points.length-1)svg.append(svgEl('text',{x:x(p.year),y:H-17,'text-anchor':'middle',fill:'#6d786e','font-size':12},p.year));});
    for(const s of series){
      svg.append(svgEl('path',{d:s.points.map((p,i)=>`${i?'L':'M'}${x(p.year).toFixed(2)},${y(p.value).toFixed(2)}`).join(' '),fill:'none',stroke:colors[s.key],'stroke-width':2.7,'stroke-linejoin':'round','stroke-linecap':'round'}));
    }
    const cursor=svgEl('line',{x1:0,x2:0,y1:T,y2:H-B,stroke:'#976342','stroke-dasharray':'4 5',visibility:'hidden'});svg.append(cursor);
    const hit=svgEl('rect',{x:L,y:T,width:iw,height:ih,fill:'transparent'});svg.append(hit);host.append(svg);
    const tip=document.createElement('div');tip.className='compare-tooltip';tip.hidden=true;host.append(tip);
    hit.addEventListener('pointermove',event=>{
      const rect=svg.getBoundingClientRect();if(!rect.width)return;
      const px=(event.clientX-rect.left)/rect.width*W;
      const yr=Math.max(Number(start.value),Math.min(Number(end.value),Math.round(Number(start.value)+(px-L)/iw*(Number(end.value)-Number(start.value)))));
      cursor.setAttribute('x1',x(yr));cursor.setAttribute('x2',x(yr));cursor.setAttribute('visibility','visible');
      tip.replaceChildren();const title=document.createElement('strong');title.textContent=yr;tip.append(title);
      for(const s of series){const line=document.createElement('div');line.textContent=labels[s.key]+': '+fmt(s.points.find(p=>p.year===yr).value);tip.append(line);}
      tip.hidden=false;tip.style.left=Math.max(4,Math.min(host.clientWidth-220,event.clientX-rect.left+12))+'px';tip.style.top='24px';
    });
    hit.addEventListener('pointerleave',()=>{tip.hidden=true;cursor.setAttribute('visibility','hidden');});
    const legend=document.createElement('div');legend.className='compare-legend';
    for(const s of series){const item=document.createElement('span');const swatch=document.createElement('i');swatch.style.backgroundColor=colors[s.key];item.append(swatch,document.createTextNode(labels[s.key]));legend.append(item);}host.append(legend);
  }
  function render(){
    const keys=[...form.querySelectorAll('input[type="checkbox"]:checked')].map(el=>el.value);
    const body=$('history-results');body.replaceChildren();$('history-values-head').replaceChildren();$('history-values-body').replaceChildren();
    current=[];
    if(!keys.length){$('history-status').textContent='Selecteer minstens één reeks.';$('history-chart').replaceChildren();$('history-download').disabled=true;return;}
    const valid=rows.filter(r=>keys.every(k=>Number.isFinite(r[k])&&r[k]>0)&&(mode.value!=='real'||(Number.isFinite(r.cpi)&&r.cpi>0))).map(r=>r.year);
    if(valid.length<2){$('history-status').textContent='Er zijn onvoldoende gemeenschappelijke jaarpunten.';$('history-download').disabled=true;$('history-chart').replaceChildren();return;}
    let adjusted=false;
    if(!valid.includes(Number(start.value))||Number(start.value)>=valid.at(-1)){start.value=String(valid[0]);adjusted=true;}
    if(!valid.includes(Number(end.value))||Number(end.value)<=Number(start.value)){end.value=String(valid.at(-1));adjusted=true;}
    for(const opt of start.options)opt.disabled=!valid.includes(Number(opt.value))||Number(opt.value)>=Number(end.value);
    for(const opt of end.options)opt.disabled=!valid.includes(Number(opt.value))||Number(opt.value)<=Number(start.value);
    try{current=window.GGComparison.compare(rows,keys,Number(start.value),Number(end.value),mode.value==='real');}
    catch(e){$('history-status').textContent=e.message;$('history-chart').replaceChildren();$('history-download').disabled=true;return;}
    $('history-download').disabled=false;
    $('history-status').textContent=(adjusted?'Periode aangepast aan de gemeenschappelijke beschikbare gegevens. ':'')+`Einde ${start.value} → einde ${end.value} · ${Number(end.value)-Number(start.value)} jaarstappen · ${mode.value==='real'?'koopkracht op basis van aangeleverde CPI':'nominale waarde'}.`;
    $('history-caption').textContent=`Historische uitkomsten, einde ${start.value}–${end.value}; ${mode.value==='real'?'na CPI-correctie':'nominaal'}`;
    for(const s of current){
      const tr=document.createElement('tr');const cells=[labels[s.key],fmt(s.end),fmt(s.cagr)+'%',fmt(s.worst)+'%',s.negative+' / '+s.steps];
      cells.forEach((text,i)=>{const td=document.createElement(i===0?'th':'td');if(i===0)td.scope='row';td.textContent=text;tr.append(td);});body.append(tr);
    }
    const header=document.createElement('tr');['Jaar',...current.map(s=>labels[s.key])].forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;header.append(th);});$('history-values-head').append(header);
    current[0].points.forEach((point,i)=>{const tr=document.createElement('tr');[point.year,...current.map(s=>fmt(s.points[i].value))].forEach((value,j)=>{const cell=document.createElement(j===0?'th':'td');if(j===0)cell.scope='row';cell.textContent=value;tr.append(cell);});$('history-values-body').append(tr);});
    chart(current);
  }
  form.addEventListener('change',render);
  $('history-download').addEventListener('click',()=>{
    if(!current.length)return;
    const records=[['Jaar',...current.map(s=>labels[s.key]+' index '+(mode.value==='real'?'koopkracht':'nominaal'))],...current[0].points.map((p,i)=>[p.year,...current.map(s=>s.points[i].value.toFixed(6).replace('.',','))])];
    const csv='\uFEFF'+records.map(row=>row.join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`geldgedrag-vergelijking-${start.value}-${end.value}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
})();
