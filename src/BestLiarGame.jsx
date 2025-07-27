import React, { useState, useEffect } from 'react';
import { Users, Crown, Eye, MessageCircle, Award, Play, RotateCcw } from 'lucide-react';
import styles from './BestLiarGame.module.css';
import { db } from './firebase';
import {
    doc, setDoc, updateDoc, onSnapshot, arrayUnion, getDoc, deleteDoc, arrayRemove
} from 'firebase/firestore';

const WORD_BANK = [
  { word: "超一流運動選手的蛋", meaning: "來自《獵人×獵人》的虛構卡牌遊戲《貪婪之島》中一張極難獲得的道具卡，效果未知但稀有度極高。" },
  { word: "智利大樓", meaning: "一座位於德國漢堡的辦公大樓，因建造人靠與智利的貿易致富，將其命名為「智利大樓」。" },
  { word: "耳蝸迷宮", meaning: "出自日本作家村上春樹的短篇小說《去中國的小船》 中的一個概念。在故事中，它被用來形容一種極為複雜且難以理解的「中國思想迴路」，就像一個難以走出的迷宮，代表著某種思維方式的深奧與難解。" },
  { word: "空氣鳳梨", meaning: "是一種不需要土壤、只靠葉片吸收空氣中水分和養分就能存長的植物，屬於鐵蘭屬（Tillandsia），因外形與鳳梨科植物有親緣關係而得名。" },
  { word: "鬱金香狂熱", meaning: "17世紀荷蘭發生的一次經濟泡沫事件。鬱金香球莖的價格在短時間內被炒作到極高的水平，遠超其實際價值，最終泡沫破裂，導致許多人傾家蕩產。" },
  { word: "藍色時期", meaning: "西班牙藝術家畢卡索在1901年至1904年間的藝術創作時期。此期間他的作品主要使用藍色和藍綠色調，主題多為貧困、孤獨和悲傷。" },
  { word: "馬特洪峰", meaning: "位於瑞士和義大利邊界的一座阿爾卑斯山峰，以其獨特的金字塔形狀而聞名，是許多登山愛好者的目標。" },
  { word: "魔鬼定律", meaning: "俗稱「墨菲定律」（Murphy's Law），指「凡是可能出錯的事，就一定會出錯」。" },
  { word: "金絲雀礦工", meaning: "早期礦工會攜帶金絲雀進入礦井，用來檢測空氣中有害氣體（如一氧化碳）。金絲雀對這些氣體敏感，當牠們表現出不適或死亡時，就代表礦井有危險，警示礦工撤離。" },
  { word: "羅夏墨跡測驗", meaning: "心理學上常用的一種投射測驗，透過讓受試者解釋標準化的墨跡圖案，來分析其潛意識中的思想、情緒和個性特徵。" },
  { word: "克里特公牛", meaning: "希臘神話中的一個故事，指海神波塞冬賜予克里特國王米諾斯的一頭白色公牛。因米諾斯違背承諾未獻祭此牛，導致後來一系列災難，包括米諾陶洛斯的誕生。" },
  { word: "達摩克利斯之劍", meaning: "古希臘傳說中的故事，西西里島暴君狄奧尼修斯二世為了教訓他的諂媚者達摩克利斯，讓他在宴會中坐在王座上，頭頂懸掛著一把只用一根馬鬃吊著的劍。象徵著身居高位者所面臨的危險和不安。" },
  { word: "烏利波", meaning: "一個由法國作家和數學家於1960年創立的實驗性文學團體，旨在透過數學或限制性寫作方法來激發新的文學創作。" },
  { word: "烏咖哩", meaning: " 烏咖哩（Ugali）是一種東非和中非地區的主食，由玉米粉、高粱粉或木薯粉等穀物粉與水煮製而成的濃稠糊狀食物，它的名稱是斯瓦希語的音譯，與印度的「咖哩（Curry）」毫無關係。" },
  { word: "班巴拉", meaning: " 班巴拉（Bambara）是西非國家馬利（Mali）的一種主要民族名稱，也是其民族語言的名稱，屬於尼日-剛果語系。與任何樂器或舞步無關。" },
  { word: "塔博勒", meaning: "塔博勒（Tabouleh）是一種起源於黎凡特地區（中東）的素食沙拉。其名稱是阿拉伯語音譯，與桌面或法式甜點無關。" },
  { word: "馬鈴薯戰爭", meaning: "「馬鈴薯戰爭」是1778-1779年間，普魯士與奧地利之間為爭奪巴伐利亞繼承權而爆發的一場「不流血」的戰爭。之所以得名，是因為雙方軍隊都沒有積極交戰，而是花費大量時間互相搜尋和掠奪對方陣地裡的馬鈴薯等食物，以補充給養並削弱敵人。" },
  { word: "茶黨事件", meaning: "「茶黨事件」發生在1773年，是美國獨立戰爭前夕殖民地人民反抗英國高稅收的一場激烈抗議行動。" },
  { word: "Hotel California (加州旅館)", meaning: " 這首由老鷹樂隊（Eagles）演唱的經典歌曲，並非真的在描述一家具體的旅館，而是一首充滿寓意和象徵的歌曲。" },
  { word: "把耳朵叫醒", meaning: "由莫文蔚演唱的歌曲，並非字面上叫醒耳朵。歌詞透過「把耳朵叫醒」來比喻喚醒對聲音、對愛、對周遭一切的敏銳感受和知覺，是一種感官上的覺醒，以及對愛情逝去的省思，帶有淡淡的失落與感傷。" },
  { word: "Gold Dust Girl (黃金粉女孩)", meaning: "貪婪之島卡牌A級指定卡，孵化後產出大量金粉，每天可收集500g金粉。" },
  { word: "Gumbo", meaning: "gumbo 其名來自安哥拉語 ngombo（意指秋葵），是美國路易斯安那州的代表性濃湯料理。" },
  { word: "阿亞卡", meaning: "是委內瑞拉的一道傳統菜餚，由玉米麵團和燉牛肉、豬肉或雞肉以及其他配料組成[2]，素食者則會加入豆類[3]。" },
  { word: "直升機撒錢 (Helicopter money)", meaning: "不是直升機實際投幣，而是指中央銀行或政府直接印錢發放給群眾以刺激經濟的理論性手段。" },
  { word: "鹹水與淡水經濟學派", meaning: "並非描述水質，而是指美國內部分別位於大西洋沿岸（鹹水）與中西部（淡水）的兩種宏觀經濟研究取向，鹹水派較支持政府干預；淡水派則較堅持理性預期與市場效率。" },
  { word: "吉芬商品 (Giffen good)", meaning: "不是人名，也不是罪名，而指價格上升時需求意外增加的商品—一種違反需求法則的極端案例。" },
  { word: "艾奇沃斯盒 (Edgeworth box)", meaning: "不是一個實體的盒子，而是用來分析兩人兩商品交換均衡的經濟學圖形模型。" },
  { word: "改土歸流", meaning: "明清推動的邊疆治理政策，由土司制改為流官治理，實質是行政與司法制度改革，但名稱中完全沒有「法」字。" },
  { word: "諾斯底主義", meaning: "諾斯底主義是一種古代的宗教和哲學運動，其核心信念是透過特殊的「諾斯」（gnosis，意為知識或領悟）才能獲得救贖。諾斯底主義強調人類內在的神性火花，並認為解脫之道在於認識到這種神聖本質。" },
  { word: "奧卡姆剃刀", meaning: "奧卡姆剃刀是一個哲學原則，由中世紀邏輯學家奧卡姆的威廉提出。其核心思想是：「如無必要，勿增實體」，意味著在解釋同一現象的眾多假設中，最簡單、最少假設的解釋往往是最好的。" },
  { word: "月暈效應", meaning: "是一種認知偏誤，指人們對一個人的某一方面（例如外貌、聲譽或單一特質）的良好印象，會擴散到其其他方面，使其整體評價也偏高，如同月亮周圍的光暈。" },
  { word: "大象在房間裡（The Elephant in the Room）", meaning: "是一個英語成語，比喻一個顯而易見卻被所有人刻意迴避、不願提及的重大問題或爭議。就像房間裡有一頭大象一樣，它的存在感非常強烈，但大家卻選擇視而不見、避而不談，以免引起尷尬或衝突。" },
  { word: "隱形粉紅獨角獸", meaning: "是一個由虛構宗教創造出來用以諷刺有神論的女神，其形象被矛盾地塑造成既不可見卻又是粉紅色的狀態。這使她成為無神論者或其他類型的宗教懷疑論者在批評宗教時常用的圖例。" },
  { word: "飛天麵神", meaning: "是飛行麵條怪物信仰（Church of the Flying Spaghetti Monster，或稱Pastafarianism，又譯飛天麵條神教、飛行麵條神教、飛麵神教）信奉的神祇，其是一場以諷刺的方式反對某些宗教教派把所宣稱的智慧設計論加入美國公立學校的自然科學課的社會運動。" },
  { word: "羅素的茶壺", meaning: "哲學家伯特蘭·羅素塑造的一個類比概念，說明舉證責任在於提出不可證偽的宣稱的人，特別是在宗教的情況。" },
  { word: "櫻桃熟了", meaning: "英文歌《櫻桃熟了》（Cherry Ripe），詞作者羅伯特·赫里克，曲作者查爾斯·愛德華·霍恩。" },
  { word: "庇護五世", meaning: "（西班牙語：Pío Quinto）是一種尼加拉瓜的傳統聖誕蛋糕，製作方法是將浸透朗姆酒的蛋糕澆蓋一層卡士達醬，再撒上肉桂粉而成；有時候會還加入葡萄乾。" },
  { word: "阿瑞巴", meaning: "是哥倫比亞和委內瑞拉的一種玉米餅，在考古遺址中可以找到美洲原住民用於烹飪阿瑞巴的容器，阿瑞巴是殖民時代沒有明顯變化的食品之一。" },
  { word: "義大利人都是好人", meaning: "是一種論調，即主張法西斯義大利和義大利皇家陸軍在第二次世界大戰期間幾乎從沒參與納粹大屠殺，也幾乎從沒犯下戰爭罪行。" },
  { word: "拿騷建議書", meaning: "是由海因里希·弗里德里希·卡爾·馮·斯坦因於1807年撰寫的普魯士政府全面國家改革的草案。它被視為是普魯士改革的濫觴之一。" },
  { word: "阿布拉西亞", meaning: "源自希臘語「ἀβρασία」，意指「不穿鞋」，或更廣泛地指「光腳」。這在某些文化或宗教習俗中有特殊意義，例如在特定儀式中赤腳代表虔誠或謙卑。" },
  { word: "烏龜脖子症候群", meaning: "並非醫學上的正式診斷，而是俗稱一種因長時間低頭使用手機或電腦，導致頸部前傾、肩部圓攏的不良體態，狀似烏龜伸長脖子，常伴隨頸部和肩部疼痛。" },
  { word: "卡夫卡式", meaning: "源於作家法蘭茲·卡夫卡的作品風格。形容一種荒誕、壓抑、毫無邏輯卻又令人感到無助和困惑的狀況或環境，通常指個人在龐大而無法理解的官僚體系中掙扎的感受。" },
  { word: "波將金村", meaning: "源於俄羅斯歷史上的一個故事。指為了欺騙上級檢查或外界觀察者，而故意搭建的虛假繁榮的場景或門面。它象徵著表面工夫、虛假宣傳和掩蓋真相的行為。" },
  { word: "巴納姆效應", meaning: "一種心理現象，指人們會普遍相信那些模糊、籠統且看似適用於自己的描述，即使這些描述實際上可以適用於任何人。例如算命和星座運勢就常常利用這種效應。" },
  { word: "藍色香蕉", meaning: "並非指某種藍色的香蕉水果，而是一個地緣政治概念，指的是一條從英國延伸到義大利、橫貫西歐工業核心地帶的密集城市化區域。它象徵著歐洲經濟和人口最密集的地區，形狀近似彎曲的香蕉，故名「藍色香蕉」。" },
  { word: "綠色黃金", meaning: "通常指咖啡豆。咖啡曾是全球貿易中的重要商品，為許多國家帶來巨大財富，因此被稱為「綠色黃金」，強調其經濟價值和重要性。" },
  { word: "阿基里斯與烏龜", meaning: "古希臘哲學家芝諾提出的一個著名悖論。阿基里斯（快跑者）永遠追不上烏龜，因為每當阿基里斯到達烏龜之前的位置時，烏龜又向前移動了一小段距離。這個悖論挑戰了人們對運動、無限和連續性的理解。" },
  { word: "奴隸兵粉碎者", meaning: "奧斯曼帝國大維齊爾穆罕默德·帕夏的其中一個綽號，源自他在1600年代初期，成功平定埃及行省的兵變而得名。這彰顯了他卓越的軍事才能和對帝國秩序的維護。" },
  { word: "冰島的啤酒禁令", meaning: "冰島曾經實施過長達74年的啤酒禁令，從1915年開始，直到1989年3月1日才解除。這段期間，雖然葡萄酒和烈酒是合法的，但酒精濃度超過2.25%的啤酒卻被嚴格禁止。現在每年3月1日被稱為「啤酒日」以紀念此事件。" },
  { word: "喀拉拉邦的教育奇蹟", meaning: "印度喀拉拉邦以其高識字率和完善的公共教育體系而聞名，儘管其經濟發展水平相對較低。這被視為一種「教育奇蹟」，證明了在經濟不富裕的情況下，政府仍可透過投入教育和醫療來大幅改善人民福祉。" },
  { word: "霍比特人的腳", meaning: "《魔戒》系列小說中，霍比特人以其毛茸茸、腳掌堅硬且不需要穿鞋的雙腳而聞名。這是作者J·R·R·托爾金為這個種族設計的獨特生理特徵，象徵他們與土地的親近和對舒適生活的追求。" },
  { word: "卡里古拉的馬", meaning: "羅馬皇帝卡里古拉的寵馬「因西塔圖斯」（Incitatus）。據說卡里古拉曾宣稱要任命牠為執政官，並為牠建造大理石馬廄、象牙馬槽，甚至讓牠在宴會上與貴族同席。這被視為卡里古拉瘋狂和暴政的象徵。" },
  { word: "達文西的鏡像字跡", meaning: "李奧納多·達文西在筆記中常常使用從右向左書寫的鏡像字跡。他用左手寫字，這樣做據說是為了避免墨水暈染，同時也可能是一種防範他人竊取其發明和思想的方式。" },
  { word: "圖特摩斯三世的木乃伊之手", meaning: "古埃及法老圖特摩斯三世的木乃伊，在被發現時，其左手呈握拳狀，手腕上戴著黃金手鐲。這是一個不尋常的發現，因為通常木乃伊的手臂會交叉放置。其原因至今仍是謎團，引發了許多歷史和考古學家的猜想。" },
  { word: "聖馬丁旗幟的顛倒", meaning: "法國屬地聖馬丁（Saint Martin）的官方旗幟與荷蘭屬地聖馬丁（Sint Maarten）的旗幟設計非常相似，僅配色與圖案稍有差異。而當地居民有時會因誤掛或不明原因將其中一方的旗幟顛倒掛起，這在當地被視為一個小小的趣聞或文化符號。" },
  { word: "眼鏡橋", meaning: "位於日本長崎市，是日本最古老的拱形石橋之一。因其在水中的倒影與橋身共同形成兩個圓圈，形似一副眼鏡，故得名。這座橋是長崎市的標誌性建築，也是重要的文化遺產。" },
  { word: "冬將軍", meaning: "「冬將軍」是西方國家對俄羅斯嚴寒冬季的擬人化稱呼，尤其是在戰爭時期。歷史上，拿破崙和希特勒的入侵都曾因俄羅斯極端惡劣的冬季氣候而遭受重創，這使得「冬將軍」成為俄羅斯抵禦外敵的象徵。" },
  { word: "埃及豔后克麗奧佩脫拉的鼻子", meaning: "法國哲學家布萊茲·帕斯卡曾說：「如果克麗奧佩脫拉的鼻子短一點，世界歷史就會完全不同。」這句話強調了偶然因素對歷史進程的巨大影響，說明一個微不足道的外貌特徵也可能改變歷史的走向。" },
  { word: "盧布爾雅那龍", meaning: "斯洛維尼亞首都盧布爾雅那的象徵。傳說城市是由古希臘英雄伊阿宋和阿爾戈英雄在尋找金羊毛歸途中與一條龍搏鬥並殺死它後建立的。龍的形象被融入市徽、橋樑和雕塑中，成為城市的守護者。" },
  { word: "納斯卡線", meaning: "位於秘魯納斯卡沙漠中的巨大地畫，由數百個複雜的圖案組成，包括動物、植物和幾何圖形。這些圖案只能從高空俯瞰才能辨識。其創作目的和方法至今仍是考古學界的謎團，引發了許多關於外星文明的猜測。" },
  { word: "通古斯事件", meaning: "1908年發生在西伯利亞通古斯地區的一次大規模爆炸事件。估計是一顆流星或彗星在空中爆炸，摧毀了約2000平方公里的森林，但未發現撞擊坑。其原因至今仍有爭議，被認為是地球近代史上最大規模的撞擊事件。" },
  { word: "印度洋的珍珠", meaning: "指斯里蘭卡。因其位於印度洋的戰略位置、美麗的自然風光以及豐富的寶石資源，被譽為「印度洋上的珍珠」。這個名稱強調了它在地緣政治和自然景觀上的獨特價值。" },
  { word: "日本的「沖繩病」", meaning: "並非一種實際的疾病，而是對一種現象的戲稱。指居住在沖繩的日本人，因當地宜人的氣候和悠閒的生活步調，工作效率或積極性可能不如日本本土的居民，甚至出現對工作提不起勁的「怠惰」現象。" },
  { word: "倫敦霧", meaning: "英國倫敦在工業革命時期常見的、由煤煙污染和自然霧氣混合形成的「煙霧」（smog）。這種霧氣非常濃重，嚴重影響能見度和空氣品質，並非單純的自然現象，而是人為污染的結果。" },
];

const WORD_BANK_CS = [
  { word: "YOLO", meaning: "在電腦視覺領域，YOLO是「You Only Look Once」的縮寫，是一種即時物件偵測演算法。它能夠在單次圖像掃描中同時預測多個物體的邊界框和類別，實現快速且高效的目標識別。" },
  { word: "PID", meaning: "在控制系統領域，PID是「比例-積分-微分 (Proportional-Integral-Derivative)」的縮寫，是一種回饋控制演算法。它廣泛應用於工業控制系統中，透過計算誤差值來調整控制器的輸出，以使系統達到期望的穩定狀態。" },
  { word: "Cookie", meaning: "在網路技術中，Cookie是一種小型文字檔案，由網站伺服器發送到用戶的瀏覽器並儲存在用戶電腦上。它用於追蹤用戶的瀏覽行為、儲存用戶登入狀態或偏好設定，以便下次訪問時提供個性化服務。" },
  { word: "Keypoints", meaning: "在姿態估計中，骨架點是指圖像或影片中人體（或其他對象）的特定、可識別的關鍵位置，例如肩膀、手肘、膝蓋、鼻子等。透過這些點的坐標，可以重構和分析人體的姿態。" },
  { word: "感受野Receptive Field", meaning: "在卷積神經網路 (CNN) 中，感受野是指輸出層上一個特定特徵值所能「看到」或受影響的輸入圖像區域。" },
  { word: "NMS", meaning: "在物件偵測中，NMS是一種後處理演算法。由於模型可能對同一個物件產生多個重疊的候選邊界框，NMS的作用是去除多餘的、重疊的低信心度預測框" }
];
const WORD_BANK_BASKETBALL = [
  { word: "普林斯頓進攻 ", meaning: "「普林斯頓進攻」是一種強調傳切配合、大量無球跑動和利用掩護的進攻戰術，由美國普林斯頓大學的籃球教練皮特·卡里爾（Pete Carril）發展並推廣。" },
  { word: "馬格西·伯格斯", meaning: " Muggsy Bogues 是NBA歷史上身高最矮的球員之一，身高僅160公分（5呎3吋）。儘管身材劣勢，他憑藉驚人的速度、敏捷的抄截和出色的傳球視野在NBA效力了14個賽季，證明了籃球不僅僅是高個子的運動。" }
];

const BestLiarGame = () => {
  const [gameState, setGameState] = useState('home'); // home, lobby, playing, ended
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isRoomHead, setIsRoomHead] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [listener, setListener] = useState('');
  const [honestPlayer, setHonestPlayer] = useState('');
  const [currentWord, setCurrentWord] = useState(null);
  const [wtfCards, setWtfCards] = useState({});
  const [usedListeners, setUsedListeners] = useState([]);
  const [playerScores, setPlayerScores] = useState({});
  const [roundPhase, setRoundPhase] = useState('playing'); // playing, ended
  const [wtfCardsUsed, setWtfCardsUsed] = useState(0);
  const [displayWtfOnPlayer, setDisplayWtfOnPlayer] = useState(null);
  const [showFullScreenWtf, setShowFullScreenWtf] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const deleteRoom = async (code) => {
    try {
      await deleteDoc(doc(db, 'rooms', code));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const createRoom = async () => {
    if (!currentPlayer.trim()) return;
    
    const code = generateRoomCode();
    const roomRef = doc(db, "rooms", code);

    try {
      await setDoc(roomRef, {
        gameState: 'lobby',
        players: [currentPlayer],
        playerScores: { [currentPlayer]: 0 },
        createdAt: Date.now(),
        currentRound: 1,
        listener: '',
        honestPlayer: '',
        currentWord: null,
        wtfCards: {},
        usedListeners: [],
        roundPhase: 'playing',
        wtfCardsUsed: 0
      });

      setRoomCode(code);
      setIsRoomHead(true);
      setGameState('lobby');
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room. Please try again.");
    }
  };

  const joinRoom = async (code) => {
    if (!currentPlayer.trim() || !code.trim()) return;
    
    const roomRef = doc(db, "rooms", code);
    
    try {
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const data = roomSnap.data();
        
        // Check if player is already in the room
        if (data.players.includes(currentPlayer)) {
          alert("A player with this name is already in the room!");
          return;
        }
        
        // Check if room is full
        if (data.players.length >= 15) {
          alert("Room is full!");
          return;
        }
        
        await updateDoc(roomRef, {
          players: arrayUnion(currentPlayer),
          [`playerScores.${currentPlayer}`]: 0
        });

        setRoomCode(code);
        setIsRoomHead(false);
        setGameState('lobby');
      } else {
        alert("Room not found!");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Error joining room. Please try again.");
    }
  };

  const startGame = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      const data = roomSnap.data();

      if (data.players.length >= 3) {
        const availableListeners = data.players.filter(p => !(data.usedListeners || []).includes(p));
        const newListener = availableListeners[Math.floor(Math.random() * availableListeners.length)];
        const remainingPlayers = data.players.filter(p => p !== newListener);
        const newHonestPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
        const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];

        await updateDoc(roomRef, {
          listener: newListener,
          honestPlayer: newHonestPlayer,
          currentWord: randomWord,
          gameState: "playing",
          roundPhase: "playing",
          wtfCardsUsed: 0,
          wtfCards: {},
          usedListeners: data.usedListeners || [],
        });
      } else {
        alert("Need at least 3 players to start!");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game. Please try again.");
    }
  };

  const sendWtfCard = async (targetPlayer) => {
    if (wtfCardsUsed >= players.length || currentPlayer !== listener || wtfCards[targetPlayer]) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    const newWtfCards = { ...wtfCards, [targetPlayer]: Date.now() };
    
    try {
      await updateDoc(roomRef, {
        wtfCards: newWtfCards,
        wtfCardsUsed: wtfCardsUsed + 1
      });
      setDisplayWtfOnPlayer(targetPlayer);
      setTimeout(() => {
        setDisplayWtfOnPlayer(null);
      }, 10000);
    } catch (error) {
      console.error("Error sending WTF card:", error);
    }
  };

  const endRound = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    let newScores = { ...playerScores };
    
    // Calculate scores
    Object.keys(wtfCards).forEach(player => {
      if (player === honestPlayer) {
        // Listener gave WTF card to honest player
        newScores[listener] = (newScores[listener] || 0) - 2;
        newScores[honestPlayer] = (newScores[honestPlayer] || 0) - 1;
      } else {
        // Listener found a liar
        newScores[listener] = (newScores[listener] || 0) + 1;
      }
    });
    
    // Liars who weren't found get points
    players.forEach(player => {
      if (player !== listener && player !== honestPlayer && !wtfCards[player]) {
        newScores[player] = (newScores[player] || 0) + 1;
      }
    });
    
    const newUsedListeners = [...usedListeners, listener];
    
    try {
      await updateDoc(roomRef, {
        playerScores: newScores,
        usedListeners: newUsedListeners,
        roundPhase: 'ended'
      });
      
      // Check if game should end
      if (newUsedListeners.length >= players.length) {
        await updateDoc(roomRef, {
          gameState: 'ended'
        });
      }
    } catch (error) {
      console.error("Error ending round:", error);
    }
  };

  const nextRound = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      const data = roomSnap.data();
      
      const availableListeners = data.players.filter(p => !data.usedListeners.includes(p));
      const newListener = availableListeners[Math.floor(Math.random() * availableListeners.length)];
      const remainingPlayers = data.players.filter(p => p !== newListener);
      const newHonestPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];

      await updateDoc(roomRef, {
        currentRound: currentRound + 1,
        listener: newListener,
        honestPlayer: newHonestPlayer,
        currentWord: randomWord,
        roundPhase: "playing",
        wtfCardsUsed: 0,
        wtfCards: {}
      });
    } catch (error) {
      console.error("Error starting next round:", error);
    }
  };

  const leaveRoom = async () => {
    if (!roomCode || !currentPlayer) return;
    
    const roomRef = doc(db, 'rooms', roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      
      const data = roomSnap.data();
      const updatedPlayers = data.players.filter(p => p !== currentPlayer);
      
      // If this is the last player, delete the room
      if (updatedPlayers.length === 0) {
        await deleteRoom(roomCode);
        resetLocalState();
        return;
      }
      
      // Clean up player-related data
      const updatedPlayerScores = { ...data.playerScores };
      delete updatedPlayerScores[currentPlayer];
      
      const updatedUsedListeners = data.usedListeners.filter(p => p !== currentPlayer);
      
      // Clean up WTF cards
      const updatedWtfCards = { ...data.wtfCards };
      delete updatedWtfCards[currentPlayer];
      
      let updateData = {
        players: updatedPlayers,
        playerScores: updatedPlayerScores,
        usedListeners: updatedUsedListeners,
        wtfCards: updatedWtfCards
      };
      
      // Handle special game state updates
      if (data.gameState === 'playing') {
        let needsNewRound = false;
        
        // If the listener left
        if (data.listener === currentPlayer) {
          needsNewRound = true;
        }
        
        // If the honest player left
        if (data.honestPlayer === currentPlayer) {
          needsNewRound = true;
        }
        
        // If we need a new round but don't have enough players
        if (needsNewRound && updatedPlayers.length < 3) {
          updateData.gameState = 'lobby';
          updateData.listener = '';
          updateData.honestPlayer = '';
          updateData.currentWord = null;
          updateData.wtfCards = {};
          updateData.usedListeners = [];
          updateData.roundPhase = 'playing';
          updateData.wtfCardsUsed = 0;
          updateData.currentRound = 1;
        } else if (needsNewRound) {
          // Start a new round with remaining players
          const availableListeners = updatedPlayers.filter(p => !updatedUsedListeners.includes(p));
          if (availableListeners.length > 0) {
            const newListener = availableListeners[Math.floor(Math.random() * availableListeners.length)];
            const remainingPlayers = updatedPlayers.filter(p => p !== newListener);
            const newHonestPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
            const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
            
            updateData.listener = newListener;
            updateData.honestPlayer = newHonestPlayer;
            updateData.currentWord = randomWord;
            updateData.wtfCards = {};
            updateData.wtfCardsUsed = 0;
            updateData.roundPhase = 'playing';
          } else {
            // All players have been listeners, end the game
            updateData.gameState = 'ended';
          }
        }
      }
      
      await updateDoc(roomRef, updateData);
      resetLocalState();
      
    } catch (error) {
      console.error("Error leaving room:", error);
      resetLocalState();
    }
  };

  const resetLocalState = () => {
    setGameState('home');
    setPlayers([]);
    setCurrentPlayer('');
    setRoomCode('');
    setInputRoomCode('');
    setIsRoomHead(false);
    setCurrentRound(1);
    setListener('');
    setHonestPlayer('');
    setCurrentWord(null);
    setWtfCards({});
    setUsedListeners([]);
    setPlayerScores({});
    setRoundPhase('playing');
    setWtfCardsUsed(0);
    setShowFullScreenWtf(false);
  };

  const resetGame = () => {
    leaveRoom();
  };

  const resetAndEndGame = () => {
    if (roomCode) {
      deleteRoom(roomCode);
    }
    resetLocalState();
  };

  const getPlayerRole = () => {
    if (currentPlayer === listener) return '聆聽者';
    if (currentPlayer === honestPlayer) return '老實人';
    return '瞎掰人';
  };

  const getPlayerRoleColor = () => {
    if (currentPlayer === listener) return styles.textBlue;
    if (currentPlayer === honestPlayer) return styles.textGreen;
    return styles.textRed;
  };

  const getRankings = () => {
    return Object.entries(playerScores)
      .sort(([,a], [,b]) => b - a)
      .map(([player, score], index) => ({ player, score, rank: index + 1 }));
  };

  // Firebase listener
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, "rooms", roomCode);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayers(data.players || []);
        setPlayerScores(data.playerScores || {});
        setGameState(data.gameState || 'lobby');
        setListener(data.listener || '');
        setHonestPlayer(data.honestPlayer || '');
        setCurrentWord(data.currentWord || null);
        setWtfCards(data.wtfCards || {});
        setUsedListeners(data.usedListeners || []);
        setRoundPhase(data.roundPhase || 'playing');
        setWtfCardsUsed(data.wtfCardsUsed || 0);
        setCurrentRound(data.currentRound || 1);
        
        // Check if current player is room head (first player)
        if (data.players && data.players.length > 0) {
          setIsRoomHead(currentPlayer === data.players[0]);
        }
      }
    });

    return () => unsub();
  }, [roomCode, currentPlayer]);

  useEffect(() => {
    if(wtfCards[currentPlayer] && gameState === 'playing') {
      const wtFTimestamp = wtfCards[currentPlayer];
      if (Date.now() - wtFTimestamp < 3000) {
        setShowFullScreenWtf(true);
        const timer = setTimeout(() => {
          setShowFullScreenWtf(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [wtfCards, currentPlayer, gameState]);

  if (gameState === 'home') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.card}>
            <h1 className={styles.title}>The Best Liar</h1>
            <p className={`${styles.subtitle} ${styles.textGray}`}>A social deduction game</p>
            
            <div className={`${styles.spaceY4} ${styles.mb8}`}>
              <input
                type="text"
                placeholder="Enter your name"
                value={currentPlayer}
                onChange={(e) => setCurrentPlayer(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.spaceY3}>
              <button
                onClick={createRoom}
                disabled={!currentPlayer.trim()}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <Users className={styles.icon} />
                Create Room
              </button>
              
              <div className={styles.flexGap2}>
                <input
                  type="text"
                  placeholder="Room Code"
                  value={inputRoomCode}
                  className={styles.inputSmall}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={() => joinRoom(inputRoomCode)}
                  disabled={!currentPlayer.trim() || !inputRoomCode.trim()}
                  className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className={styles.footer}>
            <p className={styles.footerText}>
            聽者: 聆聽每個人解釋該題目給你聽。<br />
            老實人: 擁有該題目的答案，試著別讓聽者懷疑你是瞎掰人。<br />
            瞎掰人: 不知道題目在說啥，請發揮想像力別讓聽者給你公三小。<br />
            試著擾亂他人讓自己不被懷疑直到最後一刻吧!
            </p>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.cardSmall}>
            <div className={`${styles.textCenter} ${styles.mb6}`}>
              <h2 className={styles.heading}>Room: {roomCode}</h2>
              <p className={styles.textGray}>Players: {players.length}/15</p>
            </div>
            
            <div className={`${styles.spaceY2} ${styles.mb6}`}>
              {players.map((player, index) => (
                <div key={index} className={styles.playerItem}>
                  <span className={styles.playerName}>{player}</span>
                  {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                </div>
              ))}
            </div>
            
            {isRoomHead && (
              <button
                onClick={startGame}
                disabled={players.length < 3}
                className={`${styles.button} ${styles.buttonSuccess}`}
              >
                <Play className={styles.icon} />
                Start Game {players.length < 3 && `(${3 - players.length} more needed)`}
              </button>
            )}
            
            {!isRoomHead && (
              <p className={styles.textGray}>Waiting for room host to start the game...</p>
            )}
            
            <button
              onClick={resetGame}
              className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
            >
              Leave Room
            </button>
          </div>
        </div>
        {/* Footer */}
        <div className={styles.footer}>
            <p className={styles.footerText}>
            聽者: 聆聽每個人解釋該題目給你聽。<br />
            老實人: 擁有該題目的答案，試著別讓聽者懷疑你是瞎掰人。<br />
            瞎掰人: 不知道題目在說啥，請發揮想像力別讓聽者給你公三小。<br />
            試著擾亂他人讓自己不被懷疑直到最後一刻吧!
            </p>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className={styles.container}>
        {showFullScreenWtf && (
            <div className={styles.wtfOverlay}>
              <img src="/assets/wtf-card.png" alt="WTF!" className={styles.wtfImage} />
            </div>
        )};
        <div className={styles.maxWidth2xl}>
          <div className={styles.cardSmall}>
            <div className={`${styles.textCenter} ${styles.mb6}`}>
              <h2 className={styles.heading}>Round {currentRound}</h2>
              <div className={`${styles.flexCenter} ${styles.mt2}`}>
                <Eye className={styles.icon} />
                <span className={styles.textGray}>Room: {roomCode}</span>
              </div>
            </div>
            
            <div className={`${styles.grid} ${styles.gridCols1} ${styles.gridColsMd2} ${styles.gap6} ${styles.mb6}`}>
              <div className={styles.roleCard}>
                <h3 className={styles.subheading}>你的身分</h3>
                <p className={`${styles.textLarge} ${getPlayerRoleColor()}`}>
                  {getPlayerRole()}
                </p>
              </div>
              
              <div className={styles.roleCard}>
                <h3 className={styles.subheading}>題目</h3>
                <p className={styles.textLarge}>{currentWord?.word}</p>
                {currentPlayer === honestPlayer && (
                  <p className={`${styles.textGreen} ${styles.mt1}`} style={{fontSize: '0.875rem'}}>
                    {currentWord?.meaning}
                  </p>
                )}
              </div>
            </div>
            
            {currentPlayer === listener && roundPhase === 'playing' && (
              <div className={styles.mb6}>
                <h3 className={`${styles.subheading} ${styles.mb3}`}>
                  已寄出的公三小 ({wtfCardsUsed}/{players.length -1 })
                </h3>
                <div className={`${styles.grid} ${styles.gridCols2} ${styles.gap2}`}>
                  {players.filter(p => p !== listener).map(player => (
                    <button
                      key={player}
                      onClick={() => sendWtfCard(player)}
                      disabled={wtfCardsUsed >= players.length || wtfCards[player]}
                      className={`${styles.buttonWtf} ${
                        wtfCards[player] 
                          ? styles.buttonWtfActive
                          : styles.buttonWtfInactive
                      }`}
                    >
                      {wtfCards[player] ? '❌' : '🎯'} {player}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.mb6}>
              <h3 className={`${styles.subheading} ${styles.mb3}`}>Scores</h3>
              <div className={`${styles.grid} ${styles.gridCols2} ${styles.gap2}`}>
                {players.map(player => (
                  <div key={player} className={styles.scoreItem}>
                    <span className={styles.playerName}>
                      {player}
                      {/* {displayWtfOnPlayer === player && (
                        <div className={`${styles.wtfIcon} `}>
                          ❓
                        </div>
                      )} */}
                      </span>
                    <span className={styles.score}>{playerScores[player] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {roundPhase === 'playing' && isRoomHead && (
              <div className={styles.textCenter}>
                <button
                  onClick={endRound}
                  className={`${styles.button} ${styles.buttonWarning} ${styles.px6} ${styles.py3}`}
                >
                  End Round
                </button>
                <button
                  onClick={leaveRoom}
                  className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonLeave}`}
                >
                  Leave the room
                </button>

              </div>
            )}
            
            {roundPhase === 'ended' && (
              <div className={`${styles.textCenter} ${styles.spaceY4}`}>
                <div className={styles.resultCard}>
                  <h3 className={`${styles.title} ${styles.mb2}`}>Round Results</h3>
                  <p className={styles.content}>
                    聆聽者: {listener} | 老實人: {honestPlayer}
                  </p>
                  {Object.keys(wtfCards).length > 0 && (
                    <p className={styles.content}>
                      被公三小: {Object.keys(wtfCards).join(', ')}
                    </p>
                  )}
                </div>
                
                {isRoomHead && (
                  <>
                    {usedListeners.length < players.length ? (
                      <button
                        onClick={nextRound}
                        className={`${styles.button} ${styles.buttonSuccess} ${styles.px6} ${styles.py3}`}
                      >
                        Next Round
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const roomRef = doc(db, "rooms", roomCode);
                          await updateDoc(roomRef, { gameState: 'ended' });
                        }}
                        className={`${styles.button} ${styles.buttonPrimary} ${styles.px6} ${styles.py3}`}
                      >
                        End Game
                      </button>
                    )}
                  </>
                )}
                
                {!isRoomHead && (
                  <p className={styles.textGray}>Waiting for host to continue...</p>  
                )}
              </div>
            )}
            {!isRoomHead && (
              <>
                <button
                  onClick={leaveRoom}
                  className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonLeave}`}
                >
                  Leave the room
                </button>                    
              </>  
            )}          
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    const rankings = getRankings();
    
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={`${styles.card} ${styles.textCenter}`}>
            <div className={styles.mb6}>
              <Award className={styles.iconLarge} />
              <h2 className={styles.heading}>Game Over!</h2>
              <p className={styles.textGray}>Final Rankings</p>
            </div>
            
            <div className={`${styles.spaceY3} ${styles.mb6}`}>
              {rankings.map(({ player, score, rank }) => (
                <div key={player} className={`${styles.rankingItem} ${
                  rank === 1 ? styles.rankingFirst :
                  rank === 2 ? styles.rankingSecond :
                  rank === 3 ? styles.rankingThird :
                  styles.rankingOther
                }`}>
                  <div className={styles.left}>
                    <span className={styles.rank}>#{rank}</span>
                    <span className={styles.name}>{player}</span>
                  </div>
                  <span className={styles.score}>{score}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={resetAndEndGame}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <RotateCcw className={styles.icon} />
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default BestLiarGame;