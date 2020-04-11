class RubeGoldbergMachineService {
  constructor(amplifyRequestService, apiName) {
    this.amplifyRequestService = amplifyRequestService;
    this.apiName = apiName;
  }

  startRubeGoldbergMachine() {
    return this.amplifyRequestService.requestWithAmplifyToken(this.apiName, '/sns-lambda', "GET");
  }

}

export default RubeGoldbergMachineService;