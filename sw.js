const CACHE='debloat-v2';
const FILES=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(cached=>cached||fetch(e.request).catch(()=>caches.match('/index.html')))
  );
});

// Handle message from app (in-app triggered notifications)
self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SHOW_NOTIF'){
    const{title,body,icon,tag}=e.data;
    self.registration.showNotification(title,{
      body,
      icon:icon||'/icon-192.png',
      badge:'/icon-192.png',
      tag:tag||'debloat-reminder',
      vibrate:[200,100,200],
      requireInteraction:false,
      data:{url:'/'},
      actions:[
        {action:'open',title:'Open app'},
        {action:'dismiss',title:'Dismiss'}
      ]
    });
  }
});

// Handle Web Push notifications (background, app closed)
self.addEventListener('push',e=>{
  let data={title:'🌿 Debloat Daily',body:'Time for your daily routine!'};
  try{if(e.data)data=e.data.json();}catch(err){}
  e.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body,
      icon:'/icon-192.png',
      badge:'/icon-192.png',
      tag:'debloat-reminder',
      vibrate:[200,100,200],
      requireInteraction:false,
      data:{url:'/'},
      actions:[
        {action:'open',title:'Open app'},
        {action:'dismiss',title:'Dismiss'}
      ]
    })
  );
});

// Notification click — open the app
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  if(e.action==='dismiss')return;
  e.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const c of list){if(c.url&&'focus' in c)return c.focus();}
      if(clients.openWindow)return clients.openWindow('/');
    })
  );
});
