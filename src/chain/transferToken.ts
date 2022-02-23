import Web3 from "web3";
import {AbiItem} from "web3-utils";
import { NETWORK_PROVIDER, PRIVATE_KEY, GLD_CONTRACT_ADDRESS } from "../util/secrets";
import {Request, Response} from "express";
import goldTokenABI from "./ABIs/goldTokenABI.json";

// Connect web3 with binance smart chain
const web3: Web3 = new Web3(NETWORK_PROVIDER);

// Get account
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

// Get gold token contract
const goldTokenContract = new web3.eth.Contract(goldTokenABI as AbiItem[], GLD_CONTRACT_ADDRESS);

// Transaction Page view
export  const transferView = async (req: Request, res:Response) => {

    const bnb = await web3.eth.getBalance(account.address);
    const gld = await goldTokenContract.methods.balanceOf(account.address).call({from: account.address});

    res.render("chain/transfer", {
        title: "Transfer",
        accountAddress: account.address,
        bnbBalance: web3.utils.fromWei(bnb, "ether"),
        gldBalance: web3.utils.fromWei(gld, "ether")
    });
};

// Transaction submission
export const transfer = async (req:Request, res:Response) => {

    const transactionData = req.body;

    if(transactionData.type == "gld"){

        // get tx data
        const txData = await goldTokenContract.methods.transfer(transactionData.to, web3.utils.toWei(transactionData.amount)).encodeABI();
        
        // create tx
        const tx = {
            to: goldTokenContract.options.address,
            data: txData,
            gas: "5419012",
        };

        // sign tx
        const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY, 
            (err:any, signedTx:any) => {
                if(err) console.log("TX_SIGN_ERROR: ", err);
                console.log("TX_SIGNED", signedTx);
        });

        // send tx
        await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        .on("error", (err: any) => console.log("SENDING_ERROR:", err))
        .on("transactionHash", (txHash: any) => console.log("TRANSACTION_HASH:", txHash))
        .on("receipt", (receipt: any) => console.log("RECEIPT:", receipt))
        .on("confirmation", (confirmationNo:any, receipt: any) =>
          console.log("CONFIRMED: ", confirmationNo, receipt)
        );

        res.redirect("/transfer");
        res.end();
    } 

    if(transactionData.type == "bnb") {

        // create transaction
        const tx = {
            to: transactionData.to,
            value: web3.utils.toWei(transactionData.amount, "ether"),
            gas:"5419012"
        };

        // sign transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY, 
            (err:any, signedTx:any) => {
                if(err) console.log("TX_SIGN_ERROR: ", err);
                console.log("TX_SIGNED", signedTx);
        });

        // send transaction
        await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
        .on("error", (err: any) => console.log("SENDING_ERROR:", err))
        .on("transactionHash", (txHash: any) => console.log("TRANSACTION_HASH:", txHash))
        .on("receipt", (receipt: any) => console.log("RECEIPT:", receipt))
        .on("confirmation", (confirmationNo:any, receipt: any) =>
          console.log("CONFIRMED: ", confirmationNo, receipt)
        );

        res.redirect("/transfer");
        res.end();
    }
    
};

