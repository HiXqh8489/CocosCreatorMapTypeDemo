module.export = cc.Class({
  extends: cc.Component,

  properties: {
    codeName: {
      default: "" // Stored in backend persistent storage.
    },
    displayName: {
      default: "" // Preferred NOT to be stored in backend persistent storage, unless necessary when sending i18n push notifications.
    },
    // LevelConf [BEGINS]
    buildingOrUpgradingDuration: {
      default: {}, // Could be initialized from backend returned data if necessary. 
    },
    buildingOrUpgradingRequiredResidentsCount: {
      default: {},
    },
    appearance: {
      default: {}, // Could be initialized from backend returned URI if necessary.
    },
  // LevelConf [ENDS]
  },

  ctor() {
    this.mapIns = null;
    /* 
     * Note that a "StatefulBuildableInstance"
     * - always has its DiscreteAnchorTile at (0, 0) in the local discrete coordinate system,
     * - always has continuous anchor (0.5, 0.5) within its DiscreteAnchorTile.
     *
     * Reference for correctly cropping and sizing appearance sprites https://shimo.im/docs/AsVvdtHUM7kVFktW.
     */
    this.discreteWidth = null; // In terms of count of tiles, either isometric or orthogonal, constant for all levels. 
    this.discreteHeight = null;
  },

  init(mapIns, statelessBuildableInstance, altas) {
    const self = this;
    this.mapIns = mapIns;
    const tiledMapIns = mapIns.node.getComponent(cc.TiledMap);
    let mapOrientation = tiledMapIns.getMapOrientation();
    let mapTileRectilinearSize = tiledMapIns.getTileSize();
    let mapAnchorOffset = cc.v2(0, 0);
    let tileSize = {
      width: 0,
      height: 0
    };
    let layerOffset = cc.v2(0, 0);
    this.discreteWidth = statelessBuildableInstance.discreteWidth;
    this.discreteHeight = statelessBuildableInstance.discreteHeight;

    switch (mapOrientation) {
      case cc.TiledMap.Orientation.ISO:
        let tileSizeUnifiedLength = Math.sqrt(mapTileRectilinearSize.width * mapTileRectilinearSize.width / 4 + mapTileRectilinearSize.height * mapTileRectilinearSize.height / 4);
        tileSize = {
          width: tileSizeUnifiedLength,
          height: tileSizeUnifiedLength
        };
        let cosineThetaRadian = mapTileRectilinearSize.width / 2 / tileSizeUnifiedLength;
        let sineThetaRadian = mapTileRectilinearSize.height / 2 / tileSizeUnifiedLength;

        // Actually it's the "RectilinearBoundingBox" that is used here!
        // If you don't understand the following calculation, please check the handdrafted reference diagram at "https://shimo.im/docs/AsVvdtHUM7kVFktW section#2.3.2". -- YFLu
        let boundingBoxContinuousWidth = (this.discreteWidth + this.discreteHeight) * tileSizeUnifiedLength * cosineThetaRadian;
        let boundingBoxContinuousHeight = (this.discreteWidth + this.discreteHeight) * tileSizeUnifiedLength * sineThetaRadian;

        this.boundingBoxContinuousWidth = boundingBoxContinuousWidth;
        this.boundingBoxContinuousHeight = boundingBoxContinuousHeight;

        // NOT used when positioning anchor for `StatefulBuildableInstance`.
        this.topmostAnchorTileCentreWrtBoundingBoxCentre = cc.v2(0.5 * boundingBoxContinuousWidth - this.discreteWidth * tileSizeUnifiedLength * cosineThetaRadian, 0.5 * (boundingBoxContinuousHeight - mapTileRectilinearSize.height));

        // Used when positioning anchor for `StatefulBuildableInstance`.
        this.estimatedSpriteCentreToAnchorTileCentreContinuousOffset = cc.v2(
          -(this.discreteWidth >> 1)*tileSizeUnifiedLength*cosineThetaRadian + (this.discreteHeight >> 1)*tileSizeUnifiedLength*cosineThetaRadian,
          (this.discreteWidth >> 1)*tileSizeUnifiedLength*sineThetaRadian + (this.discreteHeight >> 1)*tileSizeUnifiedLength*sineThetaRadian,
        );

        const boundaryPointOffsetRatio = 0.9; //为了避免boundary因为触碰到格子的一点点，即标记这个格子为barrier 
        const boundaryPoint1 = this.estimatedSpriteCentreToAnchorTileCentreContinuousOffset.add(cc.v2(0, 0.5 * mapTileRectilinearSize.height));

        const boundaryPoint2 = boundaryPoint1.add(cc.v2(this.discreteWidth * 0.5 * mapTileRectilinearSize.width, -this.discreteWidth * 0.5 * mapTileRectilinearSize.height));

        const boundaryPoint3 = boundaryPoint2.add(cc.v2(-this.discreteHeight * 0.5 * mapTileRectilinearSize.width, -this.discreteHeight * 0.5 * mapTileRectilinearSize.height));

        const boundaryPoint4 = boundaryPoint1.add(cc.v2(-this.discreteHeight * 0.5 * mapTileRectilinearSize.width, -this.discreteHeight * 0.5 * mapTileRectilinearSize.height));

        this.boundaryPoints = [boundaryPoint1.mul(boundaryPointOffsetRatio * boundaryPointOffsetRatio), boundaryPoint2.mul(boundaryPointOffsetRatio * boundaryPointOffsetRatio), boundaryPoint3.mul(boundaryPointOffsetRatio * boundaryPointOffsetRatio), boundaryPoint4.mul(boundaryPointOffsetRatio * boundaryPointOffsetRatio)];
        break;
      case cc.TiledMap.Orientation.ORTHO:
        // TODO
        return;

      default:
        return;
    }
    this.displayName = statelessBuildableInstance.displayName;
//    this.codeName = statelessBuildableInstance.codeName;
    this.id = statelessBuildableInstance.id;  
    for (let singleLvConf of statelessBuildableInstance.levelConfs) {
      const lv = singleLvConf.level;
      this.buildingOrUpgradingDuration[lv] = singleLvConf.buildingOrUpgradingDuration;
      this.buildingOrUpgradingRequiredResidentsCount[lv] = singleLvConf.buildingOrUpgradingRequiredResidentsCount;
      // WARNING: 如果有需要在init后马上显示相关GUI信息，要放在cb中进行显示，否则loadRes的异步可能会造成spriteFrame无法显示
      // WARNING: Should crop each "cc.SpriteFrame" from well named texture(*png+*plist) and put into `this.appearance[lv]`.  
      self.appearance[lv] = altas.getSpriteFrame(lv);
    }
    return this;
  },
  
});
