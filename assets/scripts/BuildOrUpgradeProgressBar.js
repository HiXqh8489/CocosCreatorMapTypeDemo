const ProgressNum = require('./ProgressNum');
const i18n = require('LanguageData');

cc.Class({
  extends: ProgressNum,

  properties: {
    onCompleted: {
      type: cc.Object,
      default: null,
    },
    boostButton: {
      type: cc.Button,
      default: null,
    },
    musicEffect: {
      type: cc.AudioClip,
      default: null,
    },
    isForElapsedTimeProgress: {
      default: true,
      override: true,
    },
    instantStart: {
      default: true,
      override: true,
    },
  },

  setData(startedAtMillis, durationMillis) {
    ProgressNum.prototype.setData.call(this, 0, durationMillis, startedAtMillis);
  },

  playMusicEffect(evt) {
    if (this.musicEffect) {
      cc.audioEngine.playEffect(this.musicEffect, false, 1);
    }
  },

  update(dt) {
    const self = this;
    ProgressNum.prototype.update.apply(self, arguments);
    if (null !== self.maxValue && self.currentlyDisplayingQuantity >= self.maxValue) {
      self.onCompleted && self.onCompleted();
    }
  },
});

