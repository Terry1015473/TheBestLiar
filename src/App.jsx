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
            Choose your adventure - Social deduction games await!
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
                The Best Liar
              </h2>
              
              <p className={styles.gameDescription}>
                A social deduction game where players take turns being the listener, honest player, or liar. 
                Can you spot who's telling the truth?
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
                Trolley Problem
              </h2>
              
              <p className={styles.gameDescription}>
                A moral dilemma game where teams compete to influence the driver's impossible choice. 
                Philosophy meets strategy!
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
            Choose a game above to get started. Gather your friends and let the fun begin! 🎉
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameHomepage;