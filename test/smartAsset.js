var SmartAsset = artifacts.require("./SmartAsset.sol");
var BKXToken = artifacts.require("./BKXToken.sol");

function toAscii(input) {
  return web3.toAscii(input).replace(/\u0000/g, '');
}

contract('SmartAsset', function(accounts) {

  it("Should create asset", function() {
    var smartAsset;
    var smartAssetGeneratedId;

    return SmartAsset.deployed().then(function(instance) {
      smartAsset = instance;
      return smartAsset.createAsset("BMW X5", "photo_url", "document_url", "car");
    }).then(function(result) {
      smartAssetGeneratedId = result.logs[0].args.id.c[0];
      return smartAsset.getAssetById.call(smartAssetGeneratedId);
    }).then(function(returnValue) {
      console.log(returnValue);
      assert.equal(toAscii(returnValue[0]), "BMW X5");
      assert.equal(toAscii(returnValue[1]), "photo_url");
      assert.equal(toAscii(returnValue[2]), "document_url");
      assert.equal(returnValue[9], accounts[0]);
      assert.equal(toAscii(returnValue[10]), "car");
    });
  });

  it("Should return my assets", function() {
    var smartAsset;
    var initialMyAssetsCarCount;

    return SmartAsset.deployed().then(function(instance) {
      smartAsset = instance;
      return smartAsset.getMyAssetsCount.call("car");
    }).then(function(returnValue) {
      initialMyAssetsCarCount = returnValue;
      return smartAsset.createAsset("Audi A8", "a_photo", "a_document", "car");
    }).then(function(returnValue) {
      return smartAsset.createAsset("Field", "a_photo", "a_document", "notCar");
      })
    .then(function(returnValue) {
      return smartAsset.getMyAssetsCount.call("car");
    }).then(function(returnValue) {
      assert.equal(parseInt(returnValue), parseInt(initialMyAssetsCarCount) +1);
      return smartAsset.getMyAssets.call("car", 0, 1);
    }).then(function(returnValue) {
      console.log(returnValue);

      var ids = returnValue[0];
      assert.equal(ids[0], 1);
      assert.equal(ids[1], 2);

      var descriptions = returnValue[1];
      assert.equal(toAscii(descriptions[0]), "BMW X5");
      assert.equal(toAscii(descriptions[1]), "Audi A8");

      var photoUrl = returnValue[2];
      assert.equal(toAscii(photoUrl[0]), "photo_url");
      assert.equal(toAscii(photoUrl[1]), "a_photo");

      var documents = returnValue[3];
      assert.equal(toAscii(documents[0]), "document_url");
      assert.equal(toAscii(documents[1]), "a_document");
    });
  });

  it("Should remove asset", function() {
    var smartAsset;

    var assetIdToRemove = 1;

    return SmartAsset.deployed().then(function(instance) {
      smartAsset = instance;
      return smartAsset.removeAsset(assetIdToRemove);
    }).then(function(returnValue) {
      return smartAsset.getAssetById.call(assetIdToRemove);
    }).then(function(returnValue) {
      assert(false, "Throw was expected but didn't.");
    }).catch(function(error) {
      if(error.toString().indexOf("invalid opcode") != -1) {
        console.log("We were expecting a Solidity throw (aka an invalid opcode), we got one. Test succeeded.");
      } else {
        // if the error is something else (e.g., the assert from previous promise), then we fail the test
        assert(false, error.toString());
      }
    });
  });

  it("getAssetByVin have to throw expection if asset is absent", function() {
    return SmartAsset.deployed().then(function(instance) {
      return instance.getAssetById.call(999);
    }).then(function(returnValue) {
      assert(false, "Throw was expected but didn't.");
    }).catch(function(error) {
      if(error.toString().indexOf("invalid opcode") != -1) {
        console.log("We were expecting a Solidity throw (aka an invalid opcode), we got one. Test succeeded.");
      } else {
        // if the error is something else (e.g., the assert from previous promise), then we fail the test
        assert(false, error.toString());
      }
    });
  });

  //skip it due to the logic currently being commented out in SmartAsset contract
  xit('Should change bkxPrice for transaction', function(done) {

      var bkxToken;
      var tokensAmount;
      var smartAsset;
      var newBKXFeeForTransaction = 10;

      SmartAsset.deployed().then(function(instance) {
          smartAsset = instance;
          return smartAsset.setBKXPriceForTransaction(newBKXFeeForTransaction);

      }).then(function(){

          BKXToken.deployed().then(function(instance){
              bkxToken = instance;
              return bkxToken.balanceOf(web3.eth.accounts[0]);

          }).then(function(result){
              tokensAmount = parseInt(result);

          }).then(function(){
              smartAsset.createAsset('bmw x5', 'photo', 'document', 'car');

          }).then(function() {
              return bkxToken.balanceOf(web3.eth.accounts[0]);

          }).then(function(result){

              assert.equal(parseInt(result), tokensAmount - newBKXFeeForTransaction);
              done();
          })
      })

  });

    it('Should throw error as last index is smaller that first', function() {
        var smartAsset;

        SmartAsset.deployed().then(function(instance) {
            smartAsset = instance;
            return smartAsset.getMyAssets('car', 1, 0);

        }).catch(function(error) {
            //do nothing
        })
    });

    it('Should throw error as the last index if out of bound', function() {
        var smartAsset;

        SmartAsset.deployed().then(function(instance) {
            smartAsset = instance;
            return smartAsset.getMyAssets('car', 0, 5);

        }).catch(function(error) {
            //do nothing
        })
    });

    it('Should return assets on sale', function() {
        var smartAsset;
        var smartAssetGeneratedId;

        return SmartAsset.deployed().then(function(instance) {
            smartAsset = instance;
            return smartAsset.createAsset('description' ,'photo', 'document' ,'car');

        }).then(function(result) {
            smartAssetGeneratedId = result.logs[0].args.id.c[0];

        }).then(function() {
            return smartAsset.calculateAssetPrice(smartAssetGeneratedId);

        }).then(function() {
            return smartAsset.makeOnSale(smartAssetGeneratedId);

        }).then(function(){
            return smartAsset.getAssetsOnSale('car', 0, 0);

        }).then(function(result) {
            var ids = result[0];
            assert.equal(ids[0] , smartAssetGeneratedId);

            var descriptions = result[1];
            assert.equal(toAscii(descriptions[0]), 'description');

            var photo = result[2];
            assert.equal(toAscii(photo[0]), 'photo');

            var document = result[3];
            assert.equal(toAscii(document[0]), 'document');
        })

    });

    it('Should search for smart assets', function() {
        var smartAsset;
        var smartAssetGeneratedId;

        return SmartAsset.deployed().then(function(instance) {
            smartAsset = instance;
            return smartAsset.createAsset('AbaAba' ,'photo', 'document' ,'car');

        }).then(function(result) {
            smartAssetGeneratedId = result.logs[0].args.id.c[0];

        }).then(function() {
            return smartAsset.calculateAssetPrice(smartAssetGeneratedId);

        }).then(function() {
            return smartAsset.makeOnSale(smartAssetGeneratedId);

        }).then(function() {
            return smartAsset.createAsset('BabBab' ,'photo', 'document' ,'car');

        }).then(function(result) {
            smartAssetGeneratedId = result.logs[0].args.id.c[0];

        }).then(function() {
            return smartAsset.calculateAssetPrice(smartAssetGeneratedId);

        }).then(function() {
            return smartAsset.makeOnSale(smartAssetGeneratedId);

        }).then(function() {
            return smartAsset.searchAssetsOnSaleByKeyWord('car', 'BabBab');

        }).then(function(result){

            assert.equal(1, result[0].length);

            var ids = result[0];

            assert.equal(smartAssetGeneratedId, ids[0]);

        })
    })
});
