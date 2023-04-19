const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors')
require('dotenv').config();
var jwt = require('jsonwebtoken');

const app = express();
const port =process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

const hotels = require('./Data/hotels.json')



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uidhp96.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// token verify
function VerifyJwt(req,res,next){
const authHeader = req.headers.authorization;
if(!authHeader){
    res.status(401).send({
        message:'unauthorized access'
    })
}
const token = authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
      if (err) {
        return res.status(403).send({message: 'unauthorized access'});
        
      }
      req.decoded = decoded;
      next();
    })
}



async function run (){
    try{
        const placesCollection = client.db('travelAgency').collection('places')
        const orderCollection = client.db('travelAgency').collection('orders')

        app.post('/jwt',(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
            res.send({token})
            
        })


        app.get('/places', async(req,res)=>{
            const page =parseInt( req.query.page);
            const size = parseInt(req.query.size);
            console.log(page,size)
     const query = {};

     const cursor = placesCollection.find(query)
     const places = await cursor.skip(page*size).limit(size).toArray();
     const count = await placesCollection.estimatedDocumentCount()
 res.send({count,places})
        })


        app.get('/place/:id',async(req,res)=>{

            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            // console.log(id)
            const place = await placesCollection.findOne(query)
            res.send(place)

        })

        app.get('/places/limit', async(req,res)=>{
     const query = {};

     const cursor = placesCollection.find(query)
     const place = await cursor.limit(2).toArray();
 res.send(place)
        })

          //orders Api 
        // post Kora hosse data create korar jonno

           app.post('/orders', async(req,res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
           })

           app.get('/orders', async(req,res)=>{
            // const page =parseInt( req.query.page);
            // const size = parseInt(req.query.size);
          
     const query = {};

     const cursor = orderCollection.find(query)
     const orders =await cursor.toArray();
    //  const count = await orderCollection.estimatedDocumentCount()
  res.send(orders)

        })
           app.get('/order',VerifyJwt, async(req,res)=>{
         //   const page =parseInt( req.query.page);
        //    const size = parseInt(req.query.size);
           // console.log(page,size)
          
           const decoded = req.decoded;
           console.log("inside orders api", decoded);

           if (decoded.email !==req.query.email) {

            res.status(403).send({
                message:"Unauthorized access"
            })
           }

     let query = {};

     if (req.query.email) {
        query={
            email:req.query.email
        }
        
     }


     const cursor = orderCollection.find(query)
     const orders = await cursor.toArray();
   //  const count = await orderCollection.estimatedDocumentCount()
 res.send(orders)
        })

        app.patch('/orders/:id',async (req,res)=>{
            const id = req.params.id;
            const status = req.body.status;
            const query = {_id: new ObjectId(id) }
            const updatedDoc = {
                $set:{
                    status:status
                }
            }
            const result = await orderCollection.updateOne(query,updatedDoc);
            res.send(result)
        })

        app.delete('/orders/:id', async(req,res)=>{
 const id = req.params.id;
 const query = {_id: new ObjectId(id)}
 const result = await orderCollection.deleteOne(query);
 res.send(result)

        })



    }
    finally{

    }
}

run().catch(err => console.log(err))

app.get('/',(req,res)=>{
    res.send('travel guru server is running')
});

app.get('/hotels',(req,res)=>{
 res.send(hotels)
})

// const place = require('./Data/place.json')

// app.get('/place',(req,res)=>{
//     res.send(place)
// })

app.listen(port, ()=>{
    console.log(`Travel is running on port,${port}`)
})