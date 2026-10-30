(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const num=id=>Math.max(0,Number($(id).value)||0);
  const fmt=n=>new Intl.NumberFormat('nl-BE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  function calc(){
    const monthly=num('inkomen')-num('uitgaven')-num('jaarkosten')/12;
    $('ruimte').textContent=fmt(monthly);
    $('nominaal').textContent=fmt(num('maanddoel')*12*Math.max(1,num('looptijd')));
    const expenses=num('nooduitgaven');
    $('buffermaanden').textContent=expenses>0?(num('buffer')/expenses).toLocaleString('nl-BE',{minimumFractionDigits:1,maximumFractionDigits:1})+' maanden':'Vul maanduitgaven in';
  }
  ['inkomen','uitgaven','jaarkosten','maanddoel','looptijd','buffer','nooduitgaven'].forEach(id=>$(id).addEventListener('input',calc));
  calc();
  $('download').addEventListener('click',()=>{
    const lines=['MIJN GENOEG-PLAN','geldgedrag.be','Gemaakt op: '+new Date().toLocaleDateString('nl-BE'),''];
    document.querySelectorAll('[data-field]').forEach(el=>{lines.push(el.dataset.field+':',el.value.trim()||'(nog niet ingevuld)','');});
    lines.push('Geschatte maandelijkse ruimte: '+$('ruimte').textContent,'Financiële ademruimte: '+$('buffermaanden').textContent,'Nominale uitkeringssom (geen startvermogen): '+$('nominaal').textContent,'','Dit document is een persoonlijk werkblad, geen financieel advies.');
    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mijn-genoeg-plan.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  });
  $('print').addEventListener('click',()=>window.print());
})();
