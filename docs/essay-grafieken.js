(function(root){
  'use strict';
  const labels={cpi:'Consumentenprijzen · CPI België',purchasing_power:'Resterende koopkracht · België',equity:'Wereldaandelen · MSCI ACWI IMI',gold:'Goud',wage:'Bruto jaarloon · België',house:'Verkoopprijsreeks · België',house_index:'Woningprijsindex · België',m3:'M3 · eurozone',gdp_be:'Nominaal bbp · België',debt_be:'Overheidsschuld · België',household_be:'Schuld huishoudens · België',company_be:'Schuld niet-financiële ondernemingen · België',gdp_ea20:'Nominaal bbp · EA20',debt_ea20:'Overheidsschuld · EA20'};
  const colors={cpi:'#9a7a27',purchasing_power:'#a06e44',equity:'#355c49',gold:'#a47731',wage:'#426c93',house:'#a06e44',house_index:'#a06e44',m3:'#355c49',gdp_be:'#355c49',debt_be:'#a06e44',household_be:'#426c93',company_be:'#80608b',gdp_ea20:'#355c49',debt_ea20:'#a06e44'};
  const units={cpi:'Belgische CPI · bronindex',purchasing_power:'Belgische CPI · bronindex',equity:'indexstand in EUR',gold:'EUR per troy ounce',wage:'EUR per voltijdsequivalent per jaar',house:'EUR per woning',house_index:'OECD-indexstand',m3:'miljard EUR',gdp_be:'miljard EUR per jaar',debt_be:'miljard EUR',household_be:'miljard EUR',company_be:'miljard EUR',gdp_ea20:'miljoen EUR per jaar',debt_ea20:'miljoen EUR'};
  function prepare(rows,keys,start,end,index){
    const chosen=rows.filter(r=>r.year>=start&&r.year<=end);
    if(chosen.length<2||chosen[0].year!==start||chosen.at(-1).year!==end)throw new Error('Onvoldoende gegevens voor deze periode.');
    if(chosen.some((r,i)=>i&&r.year!==chosen[i-1].year+1))throw new Error('Ontbrekende jaren worden niet doorgetrokken.');
    return keys.map(key=>{
      const source=key==='purchasing_power'?'cpi':key;
      if(chosen.some(r=>!Number.isFinite(r[source])||r[source]<=0))throw new Error('Deze periode bevat ontbrekende waarden.');
      const divisor=['debt_ea20','gdp_ea20'].includes(key)?1000:1;
      return {key,points:chosen.map(r=>({year:r.year,value:key==='purchasing_power'?100*(chosen[0].cpi/r.cpi):index?100*r[key]/chosen[0][key]:r[key]/divisor}))};
    });
  }
  function debtRatio(row,area='be',sector='debt_be'){
    if(!['debt_be','household_be','company_be'].includes(sector)||(area==='ea20'&&sector!=='debt_be'))throw new Error('Deze sectorreeks is niet beschikbaar voor dit gebied.');
    const debt=row?.[area==='ea20'?'debt_ea20':sector],gdp=row?.[area==='ea20'?'gdp_ea20':'gdp_be'];
    if(!Number.isFinite(debt)||debt<=0||!Number.isFinite(gdp)||gdp<=0)throw new Error('Ontbrekende schuld- of bbp-waarde.');
    return 100*debt/gdp;
  }
  function debtRatios(row,area='be'){
    const sectors=area==='ea20'?[['debt_be','Overheidsschuld']]:[['debt_be','Overheidsschuld'],['household_be','Huishoudens'],['company_be','Niet-financiële ondernemingen']];
    return sectors.map(([key,label])=>({key,label,value:debtRatio(row,area,key)}));
  }
  function nearestYear(first,last,pixel,left,width){return Math.max(first,Math.min(last,Math.round(first+(pixel-left)/width*(last-first))));}
  function readout(rows,series,year){const raw=rows.find(r=>r.year===year);return series.map(s=>({key:s.key,label:labels[s.key],value:s.points.find(p=>p.year===year)?.value,raw:raw?.[s.key==='purchasing_power'?'cpi':s.key],unit:units[s.key]}));}
  if(typeof module!=='undefined'&&module.exports)module.exports={prepare,nearestYear,readout,debtRatio,debtRatios};
  if(typeof document==='undefined')return;
  const fmt=(v,d=1)=>v.toLocaleString('nl-BE',{minimumFractionDigits:0,maximumFractionDigits:d});
  const el=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
  function draw(host,series,unit,uid,rows,index,selection,ratioArea){
    host.replaceChildren();const W=760,H=340,L=84,R=20,T=25,B=42,iw=W-L-R,ih=H-T-B;
    const first=series[0].points[0].year,last=series[0].points.at(-1).year;
    const hi=series.length===1&&series[0].key==='purchasing_power'?Math.max(100,...series[0].points.map(p=>p.value)):Math.max(...series.flatMap(s=>s.points.map(p=>p.value)))*1.12;
    const x=year=>L+(year-first)/(last-first)*iw,y=v=>T+ih-v/hi*ih;
    const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-labelledby':uid+'-title '+uid+'-desc'});
    svg.append(el('title',{id:uid+'-title'},unit));svg.append(el('desc',{id:uid+'-desc'},`${first} tot ${last}. Beweeg over de grafiek of tik om jaarwaarden af te lezen. Gebruik de pijltoetsen wanneer de grafiek focus heeft. De waarden staan ook in de uitklapbare tabel.`));
    for(let i=0;i<=4;i++){const value=hi*i/4,py=y(value);svg.append(el('line',{x1:L,x2:W-R,y1:py,y2:py,stroke:'#d9ddd0'}));svg.append(el('text',{x:L-10,y:py+4,'text-anchor':'end',fill:'#6d786e','font-size':12},fmt(value)));}
    const interval=last-first>15?5:last-first>7?2:1;
    for(let year=first;year<=last;year++){if(year===first||year===last||((year-first)%interval===0&&last-year>=Math.max(2,interval/2)))svg.append(el('text',{x:x(year),y:H-15,'text-anchor':'middle',fill:'#6d786e','font-size':12},year));}
    for(const s of series)svg.append(el('path',{d:s.points.map((p,i)=>`${i?'L':'M'}${x(p.year).toFixed(2)},${y(p.value).toFixed(2)}`).join(' '),fill:'none',stroke:colors[s.key],'stroke-width':2.8,'stroke-linejoin':'round','stroke-dasharray':'none'}));
    const cursor=el('line',{x1:0,x2:0,y1:T,y2:H-B,stroke:'#976342','stroke-dasharray':'4 5',visibility:'hidden'});svg.append(cursor);
    const dots=series.map(s=>{const dot=el('circle',{cx:0,cy:0,r:4,fill:colors[s.key],stroke:'#fffdf7','stroke-width':1.5,visibility:'hidden'});svg.append(dot);return dot;});
    const hit=el('rect',{x:L,y:T,width:iw,height:ih,fill:'transparent',class:'essay-chart-hit'});svg.append(hit);
    host.append(svg);
    const tip=document.createElement('div');tip.id=uid+'-tooltip';tip.className='essay-chart-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;host.append(tip);
    const announcement=document.createElement('div');announcement.className='essay-chart-sr';announcement.setAttribute('aria-live','polite');host.append(announcement);
    host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label','Interactieve grafiek. Gebruik links en rechts om jaarwaarden te lezen.');host.setAttribute('aria-describedby',uid+'-tooltip');
    let active=last;
    const show=year=>{
      active=year;cursor.setAttribute('x1',x(year));cursor.setAttribute('x2',x(year));cursor.setAttribute('visibility','visible');
      const values=readout(rows,series,year);tip.replaceChildren();const title=document.createElement('strong');title.textContent=year;tip.append(title);
      for(let i=0;i<values.length;i++){
        const v=values[i];dots[i].setAttribute('cx',x(year));dots[i].setAttribute('cy',y(v.value));dots[i].setAttribute('visibility','visible');
        const item=document.createElement('div');item.className='essay-tooltip-row';const name=document.createElement('span');name.textContent=v.label;const value=document.createElement('b');value.textContent=fmt(v.value,index?2:3)+(index?' · index':' · miljard EUR');item.append(name,value);
        if(index){const raw=document.createElement('small');const ratio=ratioArea?debtRatios(rows.find(r=>r.year===year),ratioArea).find(r=>r.key===(v.key==='debt_ea20'?'debt_be':v.key)):null;raw.textContent=fmt(v.raw,2)+' '+v.unit+(v.key==='purchasing_power'?' · '+fmt(100-v.value,2)+'% koopkrachtverlies sinds 1999':'')+(ratio?' · '+fmt(ratio.value,2)+'% van het bbp':'');item.append(raw);}tip.append(item);
      }
      tip.hidden=false;
      const bounds=svg.getBoundingClientRect(),width=tip.offsetWidth||280;
      tip.style.left=Math.max(4,Math.min(host.clientWidth-width-4,x(year)/W*bounds.width+12))+'px';tip.style.top='16px';
      announcement.textContent=year+'. '+(ratioArea?debtRatios(rows.find(r=>r.year===year),ratioArea).map(r=>r.label+' / bbp: '+fmt(r.value,2)+' procent. ').join(''):'')+values.map(v=>v.label+': '+fmt(v.value,2)+(index?' indexpunten. Bronwaarde '+fmt(v.raw,2)+' '+v.unit:' miljard euro')).join('. ');
    };
    const hide=()=>{tip.hidden=true;cursor.setAttribute('visibility','hidden');dots.forEach(dot=>dot.setAttribute('visibility','hidden'));};
    const pointer=event=>{const rect=svg.getBoundingClientRect();if(!rect.width)return;show(nearestYear(first,last,(event.clientX-rect.left)/rect.width*W,L,iw));};
    hit.addEventListener('pointermove',pointer);hit.addEventListener('click',pointer);hit.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')hide();});
    host.onfocus=()=>show(active);host.onblur=hide;
    host.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key))return;event.preventDefault();if(event.key==='Escape'){hide();return;}show(event.key==='Home'?first:event.key==='End'?last:Math.max(first,Math.min(last,active+(event.key==='ArrowRight'?1:-1))));};
    const legend=document.createElement('div');legend.className='essay-chart-legend';
    for(const key of selection?selection.keys:series.map(s=>s.key)){
      const item=document.createElement(selection?'button':'span'),swatch=document.createElement('i');swatch.style.backgroundColor=colors[key];
      if(selection){const visible=selection.visible.has(key);item.type='button';item.className='essay-series-toggle';item.setAttribute('aria-pressed',String(visible));item.disabled=visible&&selection.visible.size===1;item.addEventListener('click',()=>selection.toggle(key));}
      item.append(swatch,document.createTextNode(labels[key]));legend.append(item);
    }host.append(legend);
  }
  root.GGDataReady.then(rows=>{
    document.querySelectorAll('.essay-figure:not([data-longterm])').forEach(figure=>{
      const index=figure.dataset.mode==='index',start=figure.querySelector('[data-start]'),end=figure.querySelector('[data-end]'),area=figure.querySelector('[data-area]'),status=figure.querySelector('.essay-chart-status');
      let keys,unit,visible;
      const render=()=>{
        for(const opt of start.options)opt.disabled=Number(opt.value)>=Number(end.value);
        for(const opt of end.options)opt.disabled=Number(opt.value)<=Number(start.value);
        let series;try{series=prepare(rows,keys.filter(key=>visible.has(key)),Number(start.value),Number(end.value),index);}catch(e){status.textContent=e.message;figure.querySelector('.essay-chart').replaceChildren();figure.querySelector('.essay-chart-table').replaceChildren();return;}
        status.textContent=`${start.value}–${end.value} · ${area?(area.value==='ea20'?'EA20':'België')+' · ':''}${index?'index '+start.value+' = 100':unit}`;
        if(keys[0]==='purchasing_power'){const remaining=series[0].points.at(-1).value;status.textContent+=' · resterende koopkracht: '+fmt(remaining,2)+' van 100 · koopkrachtverlies: '+fmt(100-remaining,2)+'%';}
        const ratioArea=figure.dataset.debtRatio?(area?.value==='ea20'?'ea20':'be'):null;
        const ratios=ratioArea?debtRatios(rows.find(r=>r.year===Number(end.value)),ratioArea):[];
        const summary=figure.querySelector('[data-ratio-summary]');
        if(summary&&ratioArea){const initial=debtRatios(rows.find(r=>r.year===Number(start.value)),ratioArea);summary.innerHTML='<table class="longterm-results"><caption>Schuld als percentage van het bbp</caption><thead><tr><th scope="col">Sector</th><th scope="col">'+start.value+'</th><th scope="col">'+end.value+'</th></tr></thead><tbody>'+ratios.map((r,i)=>'<tr><th scope="row">'+r.label+'</th><td>'+fmt(initial[i].value,1)+'%</td><td>'+fmt(r.value,1)+'%</td></tr>').join('')+'</tbody></table>';}

        const selection=figure.dataset.toggleSeries?{keys,visible,toggle(key){if(visible.has(key)){if(visible.size===1)return;visible.delete(key);}else visible.add(key);render();const buttons=figure.querySelectorAll('.essay-series-toggle');const button=buttons[keys.indexOf(key)];if(button)button.focus();}}:null;
        draw(figure.querySelector('.essay-chart'),series,unit,'essay-'+figure.dataset.kind,rows,index,selection,ratioArea);
        const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent=unit;table.append(caption);
        const thead=document.createElement('thead'),tr=document.createElement('tr');['Jaar',...series.map(s=>labels[s.key]),...ratios.map(r=>r.label+' / bbp (%)')].forEach(t=>{const th=document.createElement('th');th.scope='col';th.textContent=t;tr.append(th);});thead.append(tr);table.append(thead);
        const tbody=document.createElement('tbody');series[0].points.forEach((point,i)=>{const row=document.createElement('tr');[point.year,...series.map(s=>fmt(s.points[i].value,2)),...ratios.map(r=>fmt(debtRatio(rows.find(row=>row.year===point.year),ratioArea,r.key),2))].forEach((t,j)=>{const cell=document.createElement(j===0?'th':'td');if(j===0)cell.scope='row';cell.textContent=t;row.append(cell);});tbody.append(row);});table.append(tbody);figure.querySelector('.essay-chart-table').replaceChildren(table);
      };
      const configure=()=>{
        const ea=area?.value==='ea20';keys=ea?(figure.dataset.debtRatio?['gdp_ea20','debt_ea20']:[figure.dataset.kind==='gdp'?'gdp_ea20':'debt_ea20']):figure.dataset.keys.split(',');
        visible=new Set(keys);
        unit=index?'Index · hetzelfde startjaar = 100':ea?'EA20 · miljard euro'+(figure.dataset.kind==='gdp'?' per jaar':' op jaareinde'):figure.dataset.unit;
        if(area){
          figure.querySelector('figcaption strong').textContent=figure.dataset.kind==='gdp'?(figure.dataset.debtRatio?(ea?'Bbp en overheidsschuld van ':'Bbp en schulden van '):'Nominaal bbp van ')+(ea?'de eurozone':'België'):(ea?'Overheidsschuld van de eurozone':'Uitstaande schulden in België');
          figure.querySelectorAll('.essay-chart-note:not([data-area-note]),.essay-chart-sources').forEach(e=>e.hidden=ea);figure.querySelector('[data-area-note]').hidden=!ea;
        }
        const available=rows.filter(r=>keys.every(k=>Number.isFinite(r[k==='purchasing_power'?'cpi':k])&&r[k==='purchasing_power'?'cpi':k]>0)&&(!figure.dataset.fixedStart||r.year>=Number(figure.dataset.fixedStart))).map(r=>r.year);start.replaceChildren();end.replaceChildren();
        if(available.length<2){status.textContent='Nog onvoldoende jaarpunten beschikbaar.';return;}
        for(const year of available)for(const control of [start,end]){const opt=document.createElement('option');opt.value=year;opt.textContent=year;control.append(opt);}
        start.value=figure.dataset.fixedStart||available[0];start.disabled=!!figure.dataset.fixedStart;end.value=available.at(-1);render();
      };
      start.addEventListener('change',render);end.addEventListener('change',render);if(area)area.addEventListener('change',configure);configure();
    });
  }).catch(error=>document.querySelectorAll('.essay-chart-status').forEach(e=>e.textContent=error.message));
})(typeof window!=='undefined'?window:globalThis);
