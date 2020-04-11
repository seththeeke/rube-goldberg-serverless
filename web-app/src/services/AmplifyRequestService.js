import { API } from "aws-amplify";

class AmplifyRequestService {

    setIdToken(idToken){
        this.idToken = idToken;
    }

    requestWithAmplifyToken(apiName, path, method, init) {
        return this.makeRequest(apiName, path, method, init);
    }

    makeRequest(apiName, path, method, init) {
        if (method === "GET"){
            return API.get(apiName, path, init);
        }
        if (method === "POST"){
            return API.post(apiName, path, init);
        }
        if (method === "PUT"){
            return API.put(apiName, path, init);
        }
        if (method === "DELETE"){
            return API.delete(apiName, path, init);
        }
    }

}

export default AmplifyRequestService;