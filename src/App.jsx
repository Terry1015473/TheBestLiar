import React, { useState } from 'react';
import { Users, Train, Crown, Award, Play, Bird, Earth } from 'lucide-react';
import styles from './GameHomepage.module.css';

// Mock components for demonstration - replace with your actual imports
import BestLiarGame from './BestLiarGame';
import TrolleyProblemGame from './TrolleyProblemGame ';
import SillyGooseGame from './SillyGooseGame';
import TheWorld from './TheWorld';
import './i18n'; // <--- Make sure this is imported
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n'; // <--- Make sure this is imported

const GameHomepage = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  if (selectedGame === 'bestliar') {
    return <BestLiarGame />;
  }

  if (selectedGame === 'trolley') {
    return <TrolleyProblemGame />;
  }

  if (selectedGame === 'sillygoose') {
    return <SillyGooseGame />;
  }

  if (selectedGame === 'TheWorld'){
    return <TheWorld />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            🎮 Game Hub
          </h1>
          <p className={styles.subtitle}>
            充滿Bug的遊戲世界 - 選擇你想體驗的糞game!
          </p>
        </div>

        {/* Game Cards */}
        <div className={styles.gameGrid}>
          {/* The Best Liar Card */}
          <div 
            onClick={() => setSelectedGame('bestliar')}
            className={`${styles.gameCard} ${styles.bestLiarCard}`}
          >
            <div className={styles.cardContent}>
              <div className={styles.iconContainer}>
                <div className={styles.iconWrapper}>
                  <Crown className={styles.icon} />
                </div>
              </div>
              
              <h2 className={styles.gameTitle}>
                瞎掰王
              </h2>
              
              <p className={styles.gameDescription}>
                瞎掰者試著讓聽者信以為真，老實人盡可能不被懷疑，聽者別聽信讒言相信自己的智慧吧!
              </p>
              
              <div className={styles.gameFeatures}>
                <div className={styles.feature}>
                  <Users className={styles.featureIcon} />
                  <span>3-15 Players</span>
                </div>
                <div className={styles.feature}>
                  <Award className={styles.featureIcon} />
                  <span>Deduction & Bluffing</span>
                </div>
              </div>
              
              <div className={styles.buttonContainer}>
                <button className={`${styles.playButton} ${styles.bestLiarButton}`}>
                  <Play className={styles.buttonIcon} />
                  Play Now
                </button>
              </div>
            </div>
          </div>

          {/* Trolley Problem Card */}
          <div 
            onClick={() => setSelectedGame('trolley')}
            className={`${styles.gameCard} ${styles.trolleyCard}`}
          >
            <div className={styles.cardContent}>
              <div className={styles.iconContainer}>
                <div className={`${styles.iconWrapper} ${styles.trolleyIconWrapper}`}>
                  <Train className={styles.icon} />
                </div>
              </div>
              
              <h2 className={styles.gameTitle}>
                電車難題 - 終極審判
              </h2>
              
              <p className={styles.gameDescription}>
                尋找你內心中真正在乎的東西，窺探人性的光輝。
                保護自己的鐵路不被衝撞，理解司機使他選擇撞向另一側。
                善用特性牌改變卡牌的本質。
              </p>
              
              <div className={styles.gameFeatures}>
                <div className={styles.feature}>
                  <Users className={styles.featureIcon} />
                  <span>4+ Players</span>
                </div>
                <div className={styles.feature}>
                  <Award className={styles.featureIcon} />
                  <span>Ethics & Strategy</span>
                </div>
              </div>
              
              <div className={styles.buttonContainer}>
                <button className={`${styles.playButton} ${styles.trolleyButton}`}>
                  <Play className={styles.buttonIcon} />
                  Play Now
                </button>
              </div>
            </div>
          </div>

          {/* Silly Goose Game */}
          <div 
            onClick={() => setSelectedGame('sillygoose')}
            className={`${styles.gameCard} ${styles.sillygooseCard}`}
          >
            <div className={styles.cardContent}>
              <div className={styles.iconContainer}>
                <div className={`${styles.iconWrapper} ${styles.sillygooseIconWrapper}`}>
                  <Bird className={styles.icon} />
                </div>
              </div>
              
              <h2 className={styles.gameTitle}>
                誰是糊塗鬼
              </h2>
              
              <p className={styles.gameDescription}>
                糊塗鬼總是喜歡裝傻，雖然讓人火大，
                但說到底，那也只是「裝」的。
                不像你身旁的隊友——他是真的傻。
              </p>
              
              <div className={styles.gameFeatures}>
                <div className={styles.feature}>
                  <Users className={styles.featureIcon} />
                  <span>4 Players</span>
                </div>
                <div className={styles.feature}>
                  <Award className={styles.featureIcon} />
                  <span>Cooperation & Suspicion</span>
                </div>
              </div>
              
              <div className={styles.buttonContainer}>
                <button className={`${styles.playButton} ${styles.sillygooseButton}`}>
                  <Play className={styles.buttonIcon} />
                  Play Now
                </button>
              </div>
            </div>
          </div>

          {/* The World */}
          <div 
            onClick={() => setSelectedGame('TheWorld')}
            className={`${styles.gameCard} ${styles.theWorldCard}`}
          >
            <div className={styles.cardContent}>
              <div className={styles.iconContainer}>
                <div className={`${styles.iconWrapper} ${styles.theWorldIconWrapper}`}>
                  <Earth className={styles.icon} />
                </div>
              </div>
              
              <h2 className={styles.gameTitle}>
                The World
              </h2>
              
              <p className={styles.gameDescription}>
                Still Testing
              </p>
              
              <div className={styles.gameFeatures}>
                <div className={styles.feature}>
                  <Users className={styles.featureIcon} />
                  <span>6 Players</span>
                </div>
                <div className={styles.feature}>
                  <Award className={styles.featureIcon} />
                  <span>Cooperation? and Suspicion? or Selfish</span>
                </div>
              </div>
              
              <div className={styles.buttonContainer}>
                <button className={`${styles.playButton} ${styles.theWorldButton}`}>
                  <Play className={styles.buttonIcon} />
                  Play Now
                </button>
              </div>
            </div>
          </div>          

          {/* 5th game */}


        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Choose a game above to get started. Gather your friends and let the fun begin! <br />
            瑞登食品集團開發
          </p>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <I18nextProvider i18n={i18n}>
    <GameHomepage />
  </I18nextProvider>
);

export default GameHomepage;