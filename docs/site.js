(()=>{
  'use strict';
  document.body.classList.add('has-js');
  const toggle=document.querySelector('.menu-toggle');
  const navigation=document.querySelector('#site-navigation');
  if(toggle&&navigation){
    const close=()=>{
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Menu openen');
      navigation.classList.remove('is-open');
    };
    toggle.addEventListener('click',()=>{
      const open=toggle.getAttribute('aria-expanded')!=='true';
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'Menu sluiten':'Menu openen');
      navigation.classList.toggle('is-open',open);
    });
    navigation.addEventListener('click',event=>{if(event.target.closest('a'))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus();}});
    document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))close();});
  }
  document.querySelectorAll('a[aria-disabled="true"]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();alert(link.title);
  }));
})();
