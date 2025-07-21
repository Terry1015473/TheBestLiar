import React, { useState } from 'react';
import { Users, Train, Crown, Award, Play } from 'lucide-react';
import styles from './GameHomepage.module.css';

// Mock components for demonstration - replace with your actual imports
import BestLiarGame from './BestLiarGame';
import TrolleyProblemGame from './TrolleyProblemGame ';

const GameHomepage = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  if (selectedGame === 'bestliar') {
    return <BestLiarGame />;
  }

  if (selectedGame === 'trolley') {
    return <TrolleyProblemGame />;
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
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Choose a game above to get started. Gather your friends and let the fun begin!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameHomepage;