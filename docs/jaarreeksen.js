(function(root){
  'use strict';
  const fields={msci_eur:'equity',sp500_eur:'sp',gold_eur:'gold',bitcoin_eur:'btc',cpi_be:'cpi',wage_be_eur:'wage',house_be_eur:'house',m3_ea_bn:'m3',debt_ea20_mn:'debt_ea20',gdp_ea20_mn:'gdp_ea20',house_index_be:'house_index',debt_be_bn:'debt_be',household_debt_be_bn:'household_be',company_debt_be_bn:'company_be',gdp_be_bn:'gdp_be'};
  function parseCSV(text){
    const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(x=>x.trim());
    if(lines.length<3)throw new Error('Minstens twee jaarregels zijn nodig.');
    const header=lines.shift().split(';');
    if(header[0]!=='year'||Object.keys(fields).some(k=>!header.includes(k)))throw new Error('De kolomkoppen van de jaarreeksen ontbreken of zijn gewijzigd.');
    const seen=new Set();
    return lines.map((line,i)=>{
      const cells=line.split(';');if(cells.length!==header.length)throw new Error(`Onjuist aantal kolommen op regel ${i+2}.`);
      const year=Number(cells[0]);if(!Number.isInteger(year)||year<1900||year>2200||seen.has(year))throw new Error(`Ongeldig of dubbel jaartal op regel ${i+2}.`);seen.add(year);
      const row={year};for(const [field,key]of Object.entries(fields)){
        const raw=cells[header.indexOf(field)].trim();const value=raw===''?null:Number(raw.replace(',','.'));
        if(value!==null&&(!Number.isFinite(value)||value<=0))throw new Error(`Ongeldige waarde bij ${year}, ${field}.`);
        if(key==='btc'&&year<2010&&value!==null)throw new Error('Bitcoin heeft in deze bron geen waarden vóór 2010.');
        row[key]=value;
      }return row;
    }).sort((a,b)=>a.year-b.year);
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={parseCSV};
  if(typeof document!=='undefined')root.GGDataReady=fetch('jaarreeksen.csv').then(response=>{if(!response.ok)throw new Error('De centrale jaarreeksen konden niet worden geladen.');return response.text();}).then(parseCSV);
})(typeof window!=='undefined'?window:globalThis);
