const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const slug=new URLSearchParams(location.search).get('slug');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let article=null;

function avatar(c){
  if(c.image_url) return `<img class="comment-avatar-image" src="${esc(c.image_url)}" alt="${esc(c.name)}">`;
  return `<span class="comment-avatar-letter">${esc((c.name||'?').trim().charAt(0).toUpperCase())}</span>`;
}

async function load(){
  if(!slug){$('discussion').innerHTML='<h1>Discussion not found.</h1>';return;}
  const {data,error}=await db.from('articles').select('id,title,subtitle,excerpt,category,author_name,published_at').eq('slug',slug).eq('status','published').single();
  if(error||!data){$('discussion').innerHTML='<h1>Discussion not found.</h1>';return;}
  article=data;
  $('discussion-title').textContent=data.title;
  $('discussion-subtitle').textContent=data.subtitle||data.excerpt||'';
  $('discussion-meta').textContent=`${data.category} · ${data.author_name} · ${data.published_at?new Date(data.published_at).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'}):''}`;
  await loadComments();
  $('comment-form').addEventListener('submit',submitComment);
  $('comment-image').addEventListener('change',previewImage);
}

async function loadComments(){
  const {data,error}=await db.from('comments').select('name,body,image_url,created_at').eq('article_id',article.id).eq('approved',true).order('created_at',{ascending:true});
  if(error){$('comment-list').innerHTML='<p>Comments could not be loaded.</p>';return;}
  $('comment-count').textContent=`${data.length} ${data.length===1?'COMMENT':'COMMENTS'}`;
  $('comment-list').innerHTML=data.length?data.map(c=>`<article class="comment-card"><div class="comment-author">${avatar(c)}<div><strong>${esc(c.name)}</strong><span>${new Date(c.created_at).toLocaleDateString('en-NG',{year:'numeric',month:'short',day:'numeric'})}</span></div></div><p>${esc(c.body).replace(/\n/g,'<br>')}</p>${c.image_url?`<img class="comment-photo" src="${esc(c.image_url)}" alt="Image shared by ${esc(c.name)}">`:''}</article>`).join(''):'<div class="empty-comments"><h3>No comments yet.</h3><p>Start the discussion.</p></div>';
}

function previewImage(e){
  const file=e.target.files[0]; const box=$('image-preview');
  if(!file){box.hidden=true;box.innerHTML='';return;}
  if(file.size>5*1024*1024){e.target.value='';box.hidden=true;box.innerHTML='';$('comment-msg').textContent='Image must be 5MB or smaller.';return;}
  box.hidden=false;box.innerHTML=`<img src="${URL.createObjectURL(file)}" alt="Selected image"><span>${esc(file.name)}</span>`;
}

async function submitComment(e){
  e.preventDefault();$('comment-msg').textContent='';
  const form=new FormData(e.target); const file=$('comment-image').files[0];
  if(file && (!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)){$('comment-msg').textContent='Please choose a JPG, PNG or WebP image under 5MB.';return;}
  let image_url=null;
  if(file){
    const safe=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,'-');
    const path=`${article.id}/${crypto.randomUUID()}-${safe}`;
    const {error:uploadError}=await db.storage.from('comment-images').upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){$('comment-msg').textContent='The picture could not be uploaded. Your comment was not submitted.';return;}
    const {data:publicData}=db.storage.from('comment-images').getPublicUrl(path); image_url=publicData.publicUrl;
  }
  const {error}=await db.from('comments').insert({article_id:article.id,name:form.get('name'),email:form.get('email')||null,body:form.get('body'),image_url,approved:false});
  $('comment-msg').textContent=error?'Could not submit comment. Please try again.':'Thank you. Your comment has been sent for moderation.';
  if(!error){e.target.reset();$('image-preview').hidden=true;$('image-preview').innerHTML='';}
}
load();
