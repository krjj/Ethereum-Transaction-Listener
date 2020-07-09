const Web3 = require('web3')

const rpcURL = "INSERT URL"
const web3 = new Web3(rpcURL)

const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder("./abi/cro.json");

const contractAddress = "0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b"

var subscription = web3.eth.subscribe('newBlockHeaders', function (error, result) {
    if (!error) {
        // console.log(result);
        return;
    }

    console.error(error);
})
    .on("connected", function (subscriptionId) {
        console.log("connected", subscriptionId);
    })
    .on("data", function (blockHeader) {
        console.log('New Block Header Event ', blockHeader.number)
        
        setTimeout(()=>{
            getBlockTransaction(blockHeader.number).then((data) => {
                console.log('Contract transactions in block no ',data[0],' are ', data[1].length, data[1])
                // persist data into database here
            }).catch((err) => {console.log("error reading the block ",err)})
        },5000)
      


    })
    .on("error", console.error);


// Get list of transactions from block using block id - related to contract address
function getBlockTransaction(id) {
    return new Promise((resolve, reject) => {
        web3.eth.getBlock(id)
            .then((block) => {

                let promiseArray = []
                for (let trx of block.transactions) {
                    promiseArray.push(web3.eth.getTransaction(trx))
                }

                Promise.all(promiseArray).then((values) => {
                    let output = []

                    for (let trxd of values) {
                        if (trxd.to === contractAddress) {
                            const result = decoder.decodeData(trxd.input);
                            let entry = {
                                'fromAddress': trxd.from,
                                'toAddressContract': trxd.to,
                                'tokenTransferReceiverAddress': result.inputs[0],
                                'tokenTranferAmount': result.inputs[1].toString(10)
                            }
                            output.push(entry)
                        }
                    }
                    resolve([id, output])
                }).catch((err) => {
                    reject(err)
                })

            }).catch((err) => {
                reject(id)
            });
    })
}


// STUB NOT IMPLEMENTED
function persistTransactionsToDbStub(transactions) {
    /*
     iterate through transactions array 
        store each transaction to table
     */
}


//getBlockTransaction(10425699).then((data) => { console.log(data) }).catch(console.error)




