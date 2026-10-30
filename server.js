const http=require('node:http');
const {DatabaseSync}=require('node:sqlite');
const {randomUUID,randomBytes}=require('node:crypto');
const fs=require('node:fs');const path=require('node:path');
function createApp(dbFile=process.env.DB_FILE||path.join(__dirname,'data','vending.sqlite'), options={}){
 if(dbFile!==':memory:')fs.mkdirSync(path.dirname(dbFile),{recursive:true});
 const db=new DatabaseSync(dbFile);db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,name TEXT,flavour TEXT,price INTEGER,stock INTEGER CHECK(stock>=0),color TEXT);
 CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,visits INTEGER DEFAULT 0,rewards INTEGER DEFAULT 0);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,customer TEXT REFERENCES customers(id),items TEXT,total INTEGER,status TEXT,redeemed INTEGER,created_at TEXT);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,customer TEXT REFERENCES customers(id));`);
 if(options.testCatalog===true && dbFile===':memory:'){
 const seed=db.prepare('INSERT OR IGNORE INTO products VALUES (?,?,?,?,?,?)');
 [['citrus','CITRUS CHARGE','Lemon / lime',25,24,'#e4ef75'],['berry','BERRY VOLT','Mixed berries',30,18,'#f4a6c1'],['original','ORIGINAL BOOST','Classic energy',20,30,'#9ed5ee']].forEach(x=>seed.run(...x));
 }
 function tx(fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}
 function error(msg,status=400){throw Object.assign(new Error(msg),{status})}
 const server=http.createServer(async(req,res)=>{const json=(status,x)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(x))};
 try{
 const u=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&u.pathname==='/healthz')return json(200,{ok:true});
 if(req.method==='GET'&&u.pathname==='/api/products')return json(200,db.prepare('SELECT * FROM products').all());
 if(u.pathname.startsWith('/api/')){
 if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)error('Origin rejected',403);
 let body={};if(req.method==='POST'){let raw='';for await(const c of req){raw+=c;if(Buffer.byteLength(raw)>16384)error('Request too large',413)}try{body=JSON.parse(raw||'{}')}catch{error('Invalid JSON')}if(!body||typeof body!=='object'||Array.isArray(body))error('Invalid request')}
 let token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('vending_session='))?.split('=')[1];
 let session=token&&db.prepare('SELECT customer FROM sessions WHERE token=?').get(token);
 if(!session){token=randomBytes(32).toString('hex');const customer=randomUUID();db.prepare('INSERT INTO customers(id) VALUES (?)').run(customer);db.prepare('INSERT INTO sessions VALUES (?,?)').run(token,customer);session={customer};res.setHeader('Set-Cookie',`vending_session=${token}; HttpOnly; SameSite=Strict; Path=/`)}
 const customer=session.customer;
 if(req.method==='GET'&&u.pathname==='/api/me')return json(200,{...db.prepare('SELECT * FROM customers WHERE id=?').get(customer),orders:db.prepare('SELECT * FROM orders WHERE customer=? ORDER BY created_at DESC').all(customer).map(o=>({...o,items:JSON.parse(o.items)}))});
 if(req.method==='POST'&&u.pathname==='/api/orders'){
 const result=tx(()=>{
 // Release the session's previous pending reservation before a replacement.
 const pending=db.prepare("SELECT * FROM orders WHERE customer=? AND status='pending'").all(customer);for(const o of pending){for(const i of JSON.parse(o.items))db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(i.quantity,i.id);db.prepare("UPDATE orders SET status='cancelled' WHERE id=?").run(o.id)}
 if(!Array.isArray(body.items)||body.items.length<1||body.items.length>3)error('Choose at least one drink');
 const ids=new Set();const items=body.items.map(i=>{if(!Number.isSafeInteger(i.quantity)||i.quantity<1||i.quantity>10||ids.has(i.id))error('Invalid quantity or duplicate product');ids.add(i.id);const p=db.prepare('SELECT * FROM products WHERE id=?').get(i.id);if(!p||p.stock<i.quantity)error('Insufficient stock',409);return{id:p.id,name:p.name,price:p.price,quantity:i.quantity}});
 const c=db.prepare('SELECT * FROM customers WHERE id=?').get(customer);const redeemed=body.redeem===true?1:0;if(redeemed&&c.rewards<1)error('No reward available');
 let total=items.reduce((s,i)=>s+i.price*i.quantity,0);if(redeemed)total-=Math.min(...items.map(i=>i.price));
 const o={id:randomUUID(),customer,items,total,status:'pending',redeemed,created_at:new Date().toISOString()};for(const i of items)db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(i.quantity,i.id);
 db.prepare('INSERT INTO orders VALUES (?,?,?,?,?,?,?)').run(o.id,customer,JSON.stringify(items),total,o.status,redeemed,o.created_at);return o;
 });return json(201,result)}
 const m=u.pathname.match(/^\/api\/orders\/([a-f0-9-]+)\/(pay|cancel)$/);
 if(req.method==='POST'&&m){const result=tx(()=>{const o=db.prepare('SELECT * FROM orders WHERE id=? AND customer=?').get(m[1],customer);if(!o)error('Order not found',404);if(o.status!=='pending')error('Order already processed',409);
 if(m[2]==='cancel'){for(const i of JSON.parse(o.items))db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(i.quantity,i.id);o.status='cancelled'}else{const c=db.prepare('SELECT * FROM customers WHERE id=?').get(customer);if(o.redeemed&&c.rewards<1)error('Reward unavailable',409);const visits=c.visits+1;db.prepare('UPDATE customers SET visits=?,rewards=? WHERE id=?').run(visits%10,c.rewards-o.redeemed+Math.floor(visits/10),customer);o.status='paid'}
 db.prepare('UPDATE orders SET status=? WHERE id=?').run(o.status,o.id);return{...o,items:JSON.parse(o.items)}});return json(200,result)}
 return json(404,{error:'Not found'})}
 if(req.method!=='GET')return json(405,{error:'Method not allowed'});
 const file=u.pathname==='/'?'index.html':u.pathname.slice(1);if(!['index.html','app.js','style.css'].includes(file))return json(404,{error:'Not found'});
 res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff'});fs.createReadStream(path.join(__dirname,'public',file)).pipe(res);
 }catch(e){json(e.status||500,{error:e.status?e.message:'Internal server error'});if(!e.status)console.error(e)}});
 return{server,db};
}
if(require.main===module){const {server}=createApp();const pi=process.argv.indexOf('--port');const port=Number(process.env.PORT||(pi>=0?process.argv[pi+1]:3000));server.listen(port,'0.0.0.0',()=>console.log(`Vending listening on ${port}`))}
module.exports={createApp};
