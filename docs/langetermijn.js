(function(root){
  'use strict';
  const columns=['year','industrial_wage_index_2015','belgian_cpi_index_2015','sp500_price_return_pct','sp500_total_return_pct'];
  const labels={wage:'Industriële uurlonen · België',price:'S&P 500 · zonder dividenden',total:'S&P 500 · herbelegde dividenden (accumulerend)'};
  const colors={wage:'#a06e44',price:'#426c93',total:'#355c49'};
  function parseCSV(text){
    const lines=text.trim().split(/\r?\n/);if(lines.shift()!==columns.join(';'))throw Error('Onverwachte kolommen.');
    const rows=lines.map(line=>{const values=line.split(';');if(values.length!==5||values.some(v=>!v.trim()))throw Error('Onvolledige gegevens.');return Object.fromEntries(columns.map((key,i)=>[key,Number(values[i])]));});
    if(rows.length<2||rows.some((r,i)=>columns.some(k=>!Number.isFinite(r[k]))||!Number.isInteger(r.year)||(i&&r.year!==rows[i-1].year+1)||r.industrial_wage_index_2015<=0||r.belgian_cpi_index_2015<=0||r.sp500_price_return_pct<=-100||r.sp500_total_return_pct<=-100))throw Error('Ongeldige jaarreeks.');
    return rows;
  }
  function prepare(rows,start,end,real=false){
    const chosen=rows.filter(r=>r.year>=start&&r.year<=end);if(chosen.length<2||chosen[0].year!==start||chosen.at(-1).year!==end||chosen.some((r,i)=>i&&r.year!==chosen[i-1].year+1))throw Error('Onvoldoende gegevens voor deze periode.');
    let price=100,total=100;const base=chosen[0];const series=Object.keys(labels).map(key=>({key,points:[]}));
    chosen.forEach((r,i)=>{if(i){price*=1+r.sp500_price_return_pct/100;total*=1+r.sp500_total_return_pct/100;}const deflator=real?base.belgian_cpi_index_2015/r.belgian_cpi_index_2015:1;const values={wage:100*(r.industrial_wage_index_2015/base.industrial_wage_index_2015),price,total};series.forEach(s=>s.points.push({year:r.year,value:values[s.key]*deflator}));});
    return series;
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={parseCSV,prepare};
  if(typeof document==='undefined')return;
  const fmt=(v,d=1)=>v.toLocaleString('nl-BE',{maximumFractionDigits:d});
  const growth=v=>(v>=100?'+':'')+fmt(v-100)+'%';
  const el=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  const host=document.getElementById('longterm-chart');if(!host)return;
  const start=document.getElementById('longterm-start'),end=document.getElementById('longterm-end'),mode=document.getElementById('longterm-mode'),scale=document.getElementById('longterm-scale'),status=document.getElementById('longterm-status');
  function draw(series){
    host.replaceChildren();const W=760,H=340,L=76,R=20,T=22,B=40,iw=W-L-R,ih=H-T-B;
    const first=series[0].points[0].year,last=series[0].points.at(-1).year,values=series.flatMap(s=>s.points.map(p=>p.value)),log=scale.value==='log';
    const transform=v=>log?Math.log10(v):v,inverse=v=>log?10**v:v;
    const lo=log?Math.floor(Math.log10(Math.min(...values))):0,hi=log?Math.ceil(Math.log10(Math.max(...values))):Math.max(...values)*1.08;
    const x=y=>L+(y-first)/(last-first)*iw,y=v=>T+ih-(transform(v)-lo)/(hi-lo)*ih;
    const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':`Vergelijking ${first}–${last}. ${log?'Logaritmische':'Lineaire'} schaal. Alle reeksen starten op 100. Gebruik de jaarwaardentabel voor alle cijfers.`});
    const ticks=log?Math.max(1,hi-lo):5;
    for(let i=0;i<=ticks;i++){const tick=lo+(hi-lo)*i/ticks,py=T+ih-i*ih/ticks;svg.append(el('line',{x1:L,x2:W-R,y1:py,y2:py,stroke:'#d9ded2'}),el('text',{x:L-10,y:py+4,'text-anchor':'end',fill:'#667367','font-size':11},fmt(inverse(tick),0)));}
    const years=[...new Set([first,...series[0].points.filter(p=>p.year%10===0&&p.year>first+2&&p.year<last-2).map(p=>p.year),last])];years.forEach(year=>svg.append(el('text',{x:x(year),y:H-13,'text-anchor':'middle',fill:'#667367','font-size':11},year)));
    series.forEach(s=>svg.append(el('path',{d:s.points.map((p,i)=>`${i?'L':'M'}${x(p.year).toFixed(2)},${y(p.value).toFixed(2)}`).join(' '),fill:'none',stroke:colors[s.key],'stroke-width':2.5})));
    const cursor=el('g',{visibility:'hidden'}),rule=el('line',{y1:T,y2:H-B,stroke:'#8d978d','stroke-dasharray':'3 4'});cursor.append(rule);const dots=series.map(s=>{const dot=el('circle',{r:4,fill:colors[s.key],stroke:'#fffdf7','stroke-width':2});cursor.append(dot);return dot;});svg.append(cursor);
    const hit=el('rect',{x:L,y:T,width:iw,height:ih,fill:'transparent',class:'essay-chart-hit',tabindex:0,role:'slider','aria-label':'Jaar aflezen; gebruik de pijltoetsen','aria-valuemin':first,'aria-valuemax':last,'aria-valuenow':first});svg.append(hit);host.append(svg);
    const tooltip=document.createElement('div');tooltip.className='essay-chart-tooltip';tooltip.hidden=true;host.append(tooltip);
    const legend=document.createElement('div');legend.className='essay-chart-legend';series.forEach(s=>{const item=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=colors[s.key];item.append(swatch,document.createTextNode(labels[s.key]));legend.append(item);});host.append(legend);
    let active=first;
    function show(year){active=year;hit.setAttribute('aria-valuenow',year);const index=year-first,items=series.map(s=>({key:s.key,value:s.points[index].value}));hit.setAttribute('aria-valuetext',year+': '+items.map(p=>labels[p.key]+' '+fmt(p.value)).join('; '));rule.setAttribute('x1',x(year));rule.setAttribute('x2',x(year));items.forEach((p,i)=>{dots[i].setAttribute('cx',x(year));dots[i].setAttribute('cy',y(p.value));});cursor.setAttribute('visibility','visible');tooltip.hidden=false;tooltip.innerHTML=`<strong>${year} · ${mode.value==='real'?'inflatiegecorrigeerd':'nominaal'}</strong>`+items.map(p=>`<div class="essay-tooltip-row"><span>${labels[p.key]}</span><b>Index ${fmt(p.value)} · ${growth(p.value)}</b></div>`).join('');const px=x(year)/W*host.clientWidth;tooltip.style.left=Math.max(6,Math.min(host.clientWidth-292,px+12))+'px';tooltip.style.top='12px';}
    function hide(){tooltip.hidden=true;cursor.setAttribute('visibility','hidden');}
    function pointer(event){const rect=svg.getBoundingClientRect();show(Math.max(first,Math.min(last,Math.round(first+((event.clientX-rect.left)/rect.width*W-L)/iw*(last-first)))));}
    hit.addEventListener('pointermove',pointer);hit.addEventListener('pointerdown',pointer);hit.addEventListener('pointerleave',hide);hit.addEventListener('focus',()=>show(active));hit.addEventListener('blur',hide);hit.addEventListener('keydown',event=>{const key=event.key;if(['ArrowLeft','ArrowRight','Home','End','Escape'].includes(key)){event.preventDefault();if(key==='Escape'){hide();return;}show(key==='Home'?first:key==='End'?last:Math.max(first,Math.min(last,active+(key==='ArrowRight'?1:-1))));}});
  }
  fetch('langetermijn.csv').then(r=>{if(!r.ok)throw Error('Gegevens niet beschikbaar.');return r.text();}).then(parseCSV).then(rows=>{
    rows.forEach(r=>{for(const select of [start,end]){const option=document.createElement('option');option.value=r.year;option.textContent=r.year;select.append(option);}});start.value=rows[0].year;end.value=rows.at(-1).year;
    function update(event){if(+start.value>=+end.value){if(event?.target===start)end.value=+start.value+1;else start.value=+end.value-1;}for(const option of start.options)option.disabled=+option.value>=+end.value;for(const option of end.options)option.disabled=+option.value<=+start.value;
      const series=prepare(rows,+start.value,+end.value,mode.value==='real');draw(series);
      status.textContent=`${start.value}–${end.value} · ${start.value} = 100 · ${mode.value==='real'?'gecorrigeerd voor Belgische inflatie':'nominale groei'} · ${scale.value==='log'?'logaritmische schaal: gelijke procentuele groei neemt evenveel ruimte in':'lineaire schaal'}.`;
      document.getElementById('longterm-caption').textContent=`Van ${start.value} tot ${end.value} · ${mode.value==='real'?'inflatiegecorrigeerd':'nominaal'}`;
      document.getElementById('longterm-results').innerHTML=series.map(s=>{const v=s.points.at(-1).value;return `<tr><th scope="row">${labels[s.key]}</th><td>${fmt(v)}</td><td>${growth(v)}</td></tr>`;}).join('');
      document.getElementById('longterm-values').innerHTML='<table><thead><tr><th scope="col">Jaar</th>'+series.map(s=>`<th scope="col">${labels[s.key]}</th>`).join('')+'</tr></thead><tbody>'+series[0].points.map((p,i)=>`<tr><th scope="row">${p.year}</th>`+series.map(s=>`<td>${fmt(s.points[i].value)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
    }
    for(const select of [start,end,mode,scale])select.addEventListener('change',update);update();
  }).catch(error=>{status.textContent='De langetermijngegevens konden niet geladen worden. Probeer de pagina opnieuw te openen.';console.error(error);});
})(typeof window!=='undefined'?window:globalThis);
