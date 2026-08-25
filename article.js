const { createClient }=supabase; const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY); const root=document.getElementById('article'); const slug=new URLSearchParams(location.search).get('slug');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){
 if(!slug){root.innerHTML='<h1>Publication not found.</h1>';return}
 const {data:a,error}=await db.from('articles').select('*').eq('slug',slug).eq('status','published').single();
 if(error||!a){root.innerHTML='<h1>Publication not found.</h1>';return}
 const {count}=await db.from('comments').select('id',{count:'exact',head:true}).eq('article_id',a.id).eq('approved',true);
 root.innerHTML=`<div class="label">${esc(a.category)}</div><h1>${esc(a.title)}</h1><p class="article-deck">${esc(a.subtitle||a.excerpt||'')}</p><div class="date">BY ${esc(a.author_name)} · ${a.published_at?new Date(a.published_at).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'}):''}</div>${a.cover_image_url?`<img class="article-cover" src="${esc(a.cover_image_url)}" alt="">`:''}<div class="article-content">${a.content_html}</div><div class="discussion-cta"><div><span class="label">READER DISCUSSION</span><h3>${count||0} ${count===1?'comment':'comments'} on this publication</h3><p>Read the conversation or add your own response, including a picture.</p></div><a class="send" href="comments.html?slug=${encodeURIComponent(a.slug)}">OPEN COMMENTS →</a></div>`;
}
load();
