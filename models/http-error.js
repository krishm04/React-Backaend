class HttpError extends Error {
    constructor(message,errorCode){
        super(message); //  this is what error pass alredy in its class
        this.code = errorCode; // this is what we pass 
    }
}
module.exports = HttpError;