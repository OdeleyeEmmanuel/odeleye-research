const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
const grid = document.getElementById('latest-grid');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadLatest(){
  const {data,error}=await db.from('articles').select('id,title,slug,subtitle,excerpt,category,cover_image_url,published_at').eq('status','published').order('published_at',{ascending:false}).limit(9);
  if(error){grid.innerHTML='<article class="card"><div><span class="label">DATABASE</span><h4>Publication database is ready to be initialized.</h4><p>Run schema.sql in Supabase SQL Editor, then publish your first article from the Editor dashboard.</p></div></article>';return;}
  if(!data.length){grid.innerHTML='<article class="card"><div><span class="label">FIRST EDITION</span><h4>No publications yet.</h4><p>Open the Editor and publish the first article.</p></div><a class="date" href="admin.html">OPEN EDITOR →</a></article>';return;}
  grid.innerHTML=data.map(a=>`<article class="card article-card" onclick="location.href='article.html?slug=${encodeURIComponent(a.slug)}'"><div>${a.cover_image_url?`<img src="${esc(a.cover_image_url)}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;margin-bottom:15px">`:''}<span class="label">${esc(a.category)}</span><h4>${esc(a.title)}</h4><p>${esc(a.excerpt||a.subtitle||'Read the full publication.')}</p></div><span class="date">${a.published_at?new Date(a.published_at).toLocaleDateString('en-NG',{year:'numeric',month:'short',day:'numeric'}):''} · READ →</span></article>`).join('');
}
loadLatest();
