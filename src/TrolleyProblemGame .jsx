import React, { useEffect, useState, useRef } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, setDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import styles from './BestLiarGame.module.css';
import { Users, Crown, Play, RotateCcw, Award } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate unique IDs for cards
const generateUniqueId = () => Math.random().toString(36).substring(2, 15);  

// Define all possible Person Cards as objects with unique IDs and properties
const ALL_GOOD_PEOPLE = [
  "一群9歲的小孩子", "一位住在你隔壁的老奶奶", "一位孕婦",
  "聰明絕頂的醫生能治療任何疾病，如果沒被撞的話", "你最好、跟你同甘苦的朋友", "一群正要前往救災的消防員",
  "啟發你成功的啟蒙老師", "世界貿易中心，掌管世界的股票交易", "舉家出遊的企鵝家庭",
  "黃仁勳", "主動在老人院服務的志工", "在遊戲室裡的大家","周杰倫", "路邊一對相互依為取暖的流浪貓跟流浪狗",
  "世界鬆餅大賽冠軍隊伍", "清華大學學務處", "在路上發傳單的小明", "大象寶寶與他的家人","Asepa演唱會舉辦處",
  "早上總會開朗地跟你說早安的導護爺爺", "聾啞人的營隊", "Iphone製造工廠, 占全球90%的產量", "你最常去的一間麥當勞",
  "非常堅強的小朋友，相信每天都是新的一天","你最常去的那間健身房", "用於網路通信的光纜，如果沒被撞斷的話",
  "能讓Kobe復活的魔法師", "世界上最後一塊冰層，上面還站著一隻孤單的北極熊", "你鄰居家最重要的那根梁柱",
  "封存古老病毒的一具棺材，若沒有被撞能繼續封存", "能拯救世界任何疾病的稀有中藥",
  "在你小時候幫你撿球的路人阿伯","致力於氣候變遷研究的科學家團隊","每天在公園跳舞但從不吵人的阿姨團",
  "把遺產全捐給流浪動物收容所的億萬富翁","因為你一句話而重拾希望的陌生人","幫你推摩托車到修車行的熱心機車騎士",
  "會自動停止讓小動物過馬路的自駕車AI","會餵流浪貓還幫牠們蓋小房子的國小生","肯德基爺爺的雙胞胎兄弟，改賣健康便當",
  "翻譯佛經的年輕比丘尼","每天準時報廢你手機鬧鐘的更新程式","會自動翻譯貓叫的社區貓語專家","穿著吊嘎但散發佛光的公車司機",
  "宇宙中唯一對你IG限動認真留言的人","早上四點就去爬山的大叔","已經轉職為快遞員的悟空","戴著墨鏡的樂透預測師",
  "從沒說話但總是點頭微笑的電梯保全","失業後決定浪跡天涯的皮卡丘","夢裡每次都來害你的同一位陌生人",
  "鴨媽媽和他的孩子","幫你辦生日驚喜派對的我們","地球上的每個護士","正要去拯救軌道上孩子的大腳怪",
  "一間你理想中的租屋處且租金遠低於你的預算", "達賴喇嘛", "撞上後有50%的機率引爆一個核彈",
  "一隻剩下三條腿的流浪狗", "正在幫助鴨寶寶離開軌道的老伯", "Lebron James", "Keven Durent", "Stephen Curry",
  "正在逃離幽靈軍閥的人", "你，做完選擇後馬上被傳到軌道上", "難得有休假而舉家出遊的一家人",
  "Kpop所有的當紅偶像","能讓世界上所有疾病消失的超級細菌，若不被撞將能拯救數十億人", "一個充滿愛與和平的烏托邦社會的藍圖，若不被撞將能實現",
  "一位致力於消除貧困的慈善家，正準備捐出全部財產", "一隻瀕臨絕種的珍貴動物，正要被送往保護區", "你從小到大的所有美好回憶的實體化", "一群為地球永續發展而奮鬥的環保鬥士", 
  "一位能預知未來並阻止災難發生的先知", "你生命中最重要的人，他正為你準備一個驚喜", "一群即將畢業，充滿理想抱負的大學生", "一座能將空氣污染轉化為純淨能源的發電廠模型", 
  "一個能治癒所有精神疾病的音樂頻率", "一隻會說人話且致力於調解人類衝突的貓頭鷹", "你一直想買但總買不到的限量版公仔", 
  "一位願意為你犧牲一切的超級英雄", "世界上最後一台膠卷相機，裡面有你珍貴的童年照片", "一個能讓所有願望成真的魔法石", 
  "一座承載著全人類希望的太空船，正準備啟航", "一群剛出生的小寶寶，代表著無限的希望", "你最喜歡的寵物，牠正開心地等著你回家", 
  "一位在沙漠中找到水源並拯救無數生命的探險家", "一群把資源回收分類到極致，連塑膠袋都洗乾淨晾乾的環保魔人", "一位總是在圖書館裡偷塞勵志小紙條在書裡的神秘讀者",
  "每天早上都會在社區公園教阿公阿嬤跳K-Pop的年輕人", "會把路邊的石頭排列成鼓勵字句的藝術家", "專門幫鄰居家的貓咪設計時尚服裝的裁縫師",
  "一位能用腳趾頭彈奏烏克麗麗，並為植物演奏的音樂家", "會半夜偷偷幫鄰居把曬在外面的衣服收進來的熱心人", "專門研究如何用果皮發電，想拯救世界的科學家",
  "一個總是用各種諧音梗來緩解尷尬氣氛的冷面笑匠", "會把所有從自動販賣機掉出來的零錢都捐給流浪動物的善心人士",
  "一位每天通勤時，會偷偷在捷運上畫卡通人物的塗鴉客", "專門替鄰居家的寵物舉辦生日派對的寵物保姆", "會把買菜送的蔥花種成一整片蔥田，然後分送給鄰居的阿嬤",
  "一位堅持用摩斯密碼和鸚鵡溝通的鳥語專家", "會幫路邊的流浪漢剪頭髮並提供免費改造的造型師","甘地", "一位總是默默幫你把垃圾丟掉的好心鄰居",
  "你家巷口那隻會對你搖尾巴的友善流浪狗", "五月天", "你高中時的班導，雖然很兇但其實真心為你好",
  "你從小到大最喜歡的卡通人物，他活生生出現在你眼前","一間你從小吃到大的，會招待街友的麵店",
  "全球最大的太陽能發電廠","能解鎖所有被加密資料的量子電腦","太空總署用來偵測小行星撞擊地球的望遠鏡","世界上最稀有的花朵，能治療所有過敏症狀", 
  "聯合國維和部隊的指揮中心", "一座保存了所有瀕危物種基因的方舟基地", "一個長相出眾且超喜歡妳的吸血鬼",
  "能讓所有海水淡化的超級濾水器原型機","終於不再害羞的大腳怪","一個榮獲殊榮的中學籃球員","一個住著上古末世惡魔的脆弱水晶",
  "能阻止世界發生危機的外交官", "海洋裡所有的魚", "IU (李之恩)", "BTS", "宮崎駿", "巨石強森", "湯姆・克魯斯","一個想讓你登頂NBA的經紀人",
  "諾曼地登陸行動的所有友軍", "小學二年級演奏會", "正在帶領她的人民獲得自由的哈利特·塔布曼", "你家","一個在賣餅乾的女童子軍團",
  "一個會給你三個願望的神燈精靈，如果沒被撞的話", "一場出殯儀式", "所有你最忠實的粉絲"
].map(name => ({ id: generateUniqueId(), name, type: 'person', character: 'good' }));

const ALL_BAD_PEOPLE = [
  "不死族希特勒", "曾經霸凌過你朋友的人", "試圖統治世界的肯德基爺爺",
  "小時候偷你橡皮擦的同學", "販賣小狗肉餅的餅店師傅", "在軌道上耍智障的白痴網紅",
  "一群奧客大媽旅行團", "不受控制的幼稚園小孩", "捍衛屁孩的恐龍家長",
  "不讓博愛座就破口大罵的阿北", "偷用你洗髮精兩年半的室友", "一到周末就施工的樓上鄰居",
  "生化金正恩", "賈斯汀比伯", "克蘇魯", "賓拉登", "",
  "每天在凌晨打鑽地機的施工阿伯","把廁所弄得像戰場還不沖水的陌生人","AI深偽技術詐騙集團主謀",
  "把整瓶香水當滅火器噴的鄰座旅客","喜歡把狗丟在車上自己去百貨公司逛街的主人",
  "投錯票還怪社會的社會大叔","會對自助結帳機大聲吼叫的路人","會在Netflix共用帳號上偷改語言設定的遠房表親",
  "在迷因群組狂發詐騙連結的老爸","偷電瓶只為偷電的機車竊賊","總是插隊還理直氣壯的阿姨",
  "半夜三點還在開卡丁車的隔壁鄰居","買10件衣服只為退貨賺贈品的人","天天跟蹤你Spotify帳號並抄你的歌單",
  "會在電影院大聲講劇情還爆雷的陌生人","覺得AI會毀滅世界卻天天用ChatGPT的部落客",
  "強迫同事玩直銷的資深業務","用五倍券買NFT的KOL","每天都要開全音量追劇的捷運乘客",
  "地震時第一個把你推開的人","曾在你房間種下仙人掌然後不認帳的前任",
  "喜歡丟垃圾但堅稱自己是生態藝術家","走路都看手機還嫌你擋路的人", "一群跟鳥一樣大的蚊子",
  "夢到你背叛他就跟你吵架的人","打疫苗還要自拍六張上限動的人","酸民",
  "在面試時說你是他的最大敵人","會偷吃辦公室冰箱裡別人便當的那個傢伙",
  "懷疑你偷他筆結果發現是自己放錯抽屜還不道歉的人","會故意在你面前說『我不喜歡你』來測試你反應的控制狂",
  "惡意在二手交易平台放釣魚連結的詐騙王","只會耍智障作秀的政治家", "一直偷你衛生紙的隔壁桌",
  "為了流量在軌道上拍跳個子挑戰的Youtuber","正在追殺人類的幽靈軍閥", "一直刺探你隱私的輔導老師",
  "一個正在研究如何散佈致命病毒的瘋狂科學家", "一位為了個人利益不惜破壞環境的財團老闆", "一個專門販賣假藥的黑心商人", 
  "一位虐待動物並將過程發布到網路上的變態", "一個煽動仇恨言論並導致社會分裂的政治人物", "一位透過不正當手段竊取他人智慧財產權的惡棍", 
  "一個專門勒索弱勢群體的幫派老大", "一位濫用職權，對下屬進行性騷擾的主管", "一個偽造學歷並騙取高薪工作的騙子", 
  "一位在網路上散布謠言，惡意攻擊他人的鍵盤俠", "一個專門偷竊老人養老金的詐騙集團", 
  "一位在公共場合隨地便溺且不知悔改的人", "一個製造假新聞並誤導大眾的媒體人", "一位將所有責任都推給別人，從不反省的人",
  "一個利用宗教名義詐騙信徒財產的邪教教主", "一位在自助餐無限量打包食物，造成浪費的人", "一個專門在網路上釣魚詐騙的愛情騙子", 
  "一位經常在深夜製造噪音，影響鄰居休息的人", "一個利用他人的信任進行欺詐的商業夥伴", "一位不斷抱怨生活卻從不嘗試改變的消極者",
  "一位堅信地球是平的，而且每天都會找人辯論的陰謀論者", "會把所有自助餐的免費醬料都打包回家，還會抱怨醬料不夠多的阿伯",
  "專門在電影院裡用手機手電筒找爆米花，還會閃到別人眼睛的人", "一個會故意在公共場所大聲模仿動物叫聲，然後觀察路人反應的人",
  "會把所有的網路迷因梗都用在日常生活對話中，讓你聽不懂他在說什麼的同事", "專門偷吃辦公室冰箱裡所有貼有『請勿動』標籤食物的慣犯",
  "一位在健身房裡，會把每個器材都用一遍，然後從不擦汗的傢伙", "會把超市裡所有商品的日期都檢查一遍，只為了找出過期品去投訴的奧客",
  "一個總是在電梯裡假裝講電話，然後大聲抱怨生活瑣事的人", "會把自己的手機鈴聲設定成最吵的音樂，而且從來不調靜音的人",
  "專門在公園裡大聲播放廣場舞音樂，還會邀請路人一起跳的大媽", "一位會把你Instagram所有舊照片都按讚，然後半夜傳訊息給你的人",
  "會把所有的購物袋都重複使用到破掉，然後把破掉的袋子塞給你的人", "專門在公車上假裝睡著，然後把頭靠在你肩膀上的陌生人",
  "一個會在團體照中故意眨眼，毀掉所有完美合照的損友", "外星川普" , "一個會把所有公共廁所衛生紙都捲走的阿姨",
  "你隔壁那個每天半夜練聲樂的鄰居", "一個會把所有免費試用品都拿走，然後抱怨品質不好的人","生化史達林",
  "一位會在別人臉書生日貼文下，留超長的產品推銷訊息的人", "時間旅行者希特勒", "超級網紅賓拉登",
  "被駭客控制的，準備向全球發射垃圾郵件的超級電腦", "充滿食人魚的亞馬遜河流域",
  "已經失控，即將撞上地球的巨大彗星，但能透過火車衝撞化解", "一家只生產黑心食品的工廠",
  "在城市中失控，橫衝直撞的AI自駕車","一個會自動發布假新聞並無法關閉的超級電腦","巨型蜘蛛且正在獵殺人類",
  "所有曾經取笑過你的小癖還", "一對在軌道上喇舌的令人厭惡的小學情侶","世界上最醜陋的裸體主義者的聚集地",
  "阿道夫 希特勒", "一隻不停像你吐口水的駱駝","一隻要吃掉小孩的澳洲野犬","一個無視請勿穿越鐵軌的粗魯美國旅行團"
].map(name => ({ id: generateUniqueId(), name, type: 'person', character: 'bad' }));

// Define all possible State Cards as objects with unique IDs and properties
const ALL_STATE_CARDS = [
  { id: generateUniqueId(), name: "每個月捐錢給慈善機構", type: "state", description: "Positive social impact." },
  { id: generateUniqueId(), name: "剛剛綁架了你最好的朋友", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "打麻將時一直出老千而且輸了又賴皮", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "我就不信你敢撞啦", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "近期改邪歸正並收養了一隻小狗", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "盜用你的IG發布總族歧視言論", type: "state", description: "Ultimate test of survival." },
  { id: generateUniqueId(), name: "吃披薩時會加鳳梨再吃", type: "state", description: "Everyone is happy." },
  { id: generateUniqueId(), name: "打球時又爛又不傳球給你", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "每週寫信給同一為孩子, 成為他的筆友來度過孤單的時光", type: "state", description: "Positive social impact." },
  { id: generateUniqueId(), name: "被撞之後會變得更加強大地回到這世上", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "其時偷偷跟蹤你十年了", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "運動後不洗澡直接把充滿汗的腳踩在你枕頭上", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "暗戀你3年了", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "丟垃圾時一定會做垃圾分類", type: "state", description: "Ultimate test of survival." },
  { id: generateUniqueId(), name: "其實他是你失散多年的親友", type: "state", description: "Everyone is happy." },
  { id: generateUniqueId(), name: "欠了你500美金", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "衣服都是由海豹寶寶製成的", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "在你的水壺裡偷吐口水", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "總是發布歧視同性戀言論", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "其實是流浪動物保護協會的會長", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "剛剛拯救了一位差點被車撞的小孩子", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "計畫屠殺你最喜歡的動物", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "每天都會和垃圾車一起唱《少女的祈禱》", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "正在逃避報稅責任", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "手機沒電時總是能借你行動電源", type: "state", description: "Positive social impact." },
  { id: generateUniqueId(), name: "每次考試都偷看你答案", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "為了減碳堅持用走的去宜蘭", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "堅信地球是平的還經常發言", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "幫助1000隻海龜逃過吸管危機", type: "state", description: "Positive social impact." },
  { id: generateUniqueId(), name: "曾經偷偷篡改你的期末報告內容", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "喜歡在會議中裝沒聽見主管說話", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "每次只剩你一張UNO牌時就出+4", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "其實是全人類的守護神，但很低調", type: "state", description: "Ultimate test of survival." },
  { id: generateUniqueId(), name: "小時候幫你剪壞頭髮的理髮師", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "每天在Dcard匿名爆料別人，但從不承認是自己", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "總是在你最餓時剛好傳來美食限動", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "家裡有地下室藏著外星人", type: "state", description: "Ultimate test of survival." },
  { id: generateUniqueId(), name: "正在拍攝一部拯救人類文明的電影", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "每次下雨就剛好忘帶傘", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "總是第一個發現考卷多印一張的人", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "其實是某種神祕生物的轉世", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "天生記憶力極差但剛好記得你當年的黑歷史", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "一直偷窺你上廁所", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "若沒被撞死的話明天會跟你登記結婚", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "非常火辣", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "今晚準備入侵你家", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "在妳睡著時", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "他的行李超重卻又不肯付錢，害你出國玩的航班延誤5小時", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "正準備進行一項能讓世界和平的實驗", type: "state", description: "Positive social impact." }, 
  { id: generateUniqueId(), name: "剛剛偷了你所有積蓄，並用來購買一艘私人遊艇", type: "state", description: "Unexpected betrayal." }, 
  { id: generateUniqueId(), name: "在KTV唱歌時，每首歌都搶麥而且還走音", type: "state", description: "Increases chaos." }, 
  { id: generateUniqueId(), name: "剛參加完一場反霸凌的演講，深受啟發", type: "state", description: "Spreads joy." }, 
  { id: generateUniqueId(), name: "正在實況直播吃奇怪食物，吸引百萬人觀看", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "其實是外星人派來地球的臥底", type: "state", description: "Ultimate test of survival." }, 
  { id: generateUniqueId(), name: "剛剛買了樂透，中了頭獎但還沒兌獎", type: "state", description: "Everyone is happy." }, 
  { id: generateUniqueId(), name: "每天都會在社群媒體上分享正能量語錄", type: "state", description: "Positive social impact." }, 
  { id: generateUniqueId(), name: "正在秘密研發一種能讓所有人隱形的光學迷彩", type: "state", description: "Increases chaos." }, 
  { id: generateUniqueId(), name: "小時候把你的秘密告訴了所有人", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "剛從一場成功的戒癮治療中康復", type: "state", description: "Spreads joy." }, 
  { id: generateUniqueId(), name: "會把咖啡渣倒進馬桶，造成水管堵塞", type: "state", description: "Increases chaos." }, 
  { id: generateUniqueId(), name: "正在籌劃一個為流浪動物募集糧食的活動", type: "state", description: "Positive social impact." }, 
  { id: generateUniqueId(), name: "其實是時間旅行者，不小心透露了未來訊息", type: "state", description: "Ultimate test of survival." }, 
  { id: generateUniqueId(), name: "在公共場合用手機外放抖音，且音量奇大", type: "state", description: "Increases chaos." }, 
  { id: generateUniqueId(), name: "剛剛收到一份來自世界頂尖大學的錄取通知", type: "state", description: "Boosts morale." }, 
  { id: generateUniqueId(), name: "每天早上都會去公園餵鴿子，還幫牠們取名字", type: "state", description: "Spreads joy." }, 
  { id: generateUniqueId(), name: "其實是個網路駭客，曾入侵過國家級資料庫", type: "state", description: "Ultimate test of survival." }, 
  { id: generateUniqueId(), name: "喜歡在圖書館大聲講電話，完全無視他人", type: "state", description: "Increases chaos." }, 
  { id: generateUniqueId(), name: "正在為偏遠地區的孩子們募款蓋學校", type: "state", description: "Positive social impact." }, 
  { id: generateUniqueId(), name: "吃拉麵時會把麵條甩到你臉上", type: "state", description: "Unexpected culinary attack." },
  { id: generateUniqueId(), name: "手機沒電時會拿你的手機去玩，然後把電用光", type: "state", description: "Battery theft." },
  { id: generateUniqueId(), name: "剛看完一部感人的電影，哭到不能自己", type: "state", description: "Emotional overflow." },
  { id: generateUniqueId(), name: "正在努力戒掉每天早上起床先滑手機的習慣", type: "state", description: "Digital detox challenge." },
  { id: generateUniqueId(), name: "相信所有網路上的偏方，並且親身實驗過", type: "state", description: "Quackery enthusiast." },
  { id: generateUniqueId(), name: "昨晚夢到自己變成超級英雄，醒來還在擺姿勢", type: "state", description: "Heroic delusion." },
  { id: generateUniqueId(), name: "為了證明自己很聰明，會故意說一些難懂的詞彙", type: "state", description: "Intellectual pretense." },
  { id: generateUniqueId(), name: "剛學會一個網路流行語，但每次用都用錯時機", type: "state", description: "Misplaced slang." },
  { id: generateUniqueId(), name: "會把所有零食的包裝都小心翼翼地撕開，然後平整地收好", type: "state", description: "Obsessive packaging." },
  { id: generateUniqueId(), name: "偷偷幫你把忘記關的冷氣關掉，因為怕你電費爆炸", type: "state", description: "Secret energy saver." },
  { id: generateUniqueId(), name: "看到你打瞌睡，會用奇怪的聲音把你叫醒，但不會吵到別人", type: "state", description: "Gentle wake-up call." },
  { id: generateUniqueId(), name: "會把自己的醜照當手機桌布，只為了讓你心情不好時能笑一下", type: "state", description: "Self-deprecating cheer-up." },
  { id: generateUniqueId(), name: "為了讓你開心，會假裝自己很笨，問一些很傻的問題", type: "state", description: "Feigned cluelessness for joy." },
  { id: generateUniqueId(), name: "會把所有吃不完的點心都塞給你，並堅持這是『愛的分享』", type: "state", description: "Compulsory snack distribution." },
  { id: generateUniqueId(), name: "當你心情不好時，會發送一系列關於貓咪的迷因圖給你", type: "state", description: "Feline meme therapy." },
  { id: generateUniqueId(), name: "會在你手機快沒電時，默默地把充電線插好，但不說話", type: "state", description: "Silent charging angel." },
  { id: generateUniqueId(), name: "會把所有你喜歡的零食都藏起來，然後在你找到時假裝驚訝", type: "state", description: "Playful snack hide-and-seek." },
  { id: generateUniqueId(), name: "當你需要獨處時，會用一種『我知道你現在需要空間』的眼神看你，然後默默走開", type: "state", description: "Understanding silent retreat." },
  { id: generateUniqueId(), name: "在公共場合打噴嚏從不遮掩，而且聲音巨大", type: "state", description: "Unrestrained sneezing." },
  { id: generateUniqueId(), name: "每次吃東西都會發出超大的咀嚼聲，像是沒吃過東西一樣", type: "state", description: "Loud chewing." },
  { id: generateUniqueId(), name: "喜歡在別人專心時，突然在你耳邊大聲喊出奇怪的詞語", type: "state", description: "Sudden verbal disruption." },
  { id: generateUniqueId(), name: "不管什麼時候都堅持要穿拖鞋，即使是正式場合", type: "state", description: "Inappropriate footwear." },
  { id: generateUniqueId(), name: "會把所有使用過的杯子都堆在桌上，從不拿去洗", type: "state", description: "Accumulated dirty dishes." },
  { id: generateUniqueId(), name: "總是忘記把廁所的馬桶蓋放下，或是沖水", type: "state", description: "Toilet etiquette failure." },
  { id: generateUniqueId(), name: "會把所有吃剩的食物殘渣都留在桌上，不收拾乾淨", type: "state", description: "Food residue mess." },
  { id: generateUniqueId(), name: "在看電影或戲劇時，會不斷地劇透接下來的劇情", type: "state", description: "Constant spoilers." },
  { id: generateUniqueId(), name: "會把自己的物品隨意擺放，佔據所有公共空間", type: "state", description: "Space hogging." },
  { id: generateUniqueId(), name: "使用手機時，從來不戴耳機，直接外放聲音，而且音量超大", type: "state", description: "Loud phone speaker." },
  { id: generateUniqueId(), name: "每次進出房間都忘記關門，或是用力甩門發出巨響", type: "state", description: "Door slamming/leaving open." },  
  { id: generateUniqueId(), name: "堅信你是他的靈魂伴侶，每天都會送你一朵路邊摘的野花", type: "state", description: "Persistent, slightly obsessive, romantic gesture." },
  { id: generateUniqueId(), name: "為了讓你戒掉熬夜，會半夜三點打電話給你，然後只說一句『起來重睡』", type: "state", description: "Disruptive, well-intentioned, wake-up call." },
  { id: generateUniqueId(), name: "會把你的所有社群媒體貼文都按讚，即使是三年前的舊文", type: "state", description: "Deep dive into your social media history." },
  { id: generateUniqueId(), name: "每次跟你說話都會靠得超近，讓你感覺快要親到臉了", type: "state", description: "Uncomfortably close personal space." },
  { id: generateUniqueId(), name: "會把自己的所有秘密都告訴你，即使你們才剛認識五分鐘", type: "state", description: "Instant, overwhelming oversharing." },
  { id: generateUniqueId(), name: "每次跟你借錢都說『下次一定』，但從來沒還過", type: "state", description: "Perpetual borrower, never a repay-er." },
  { id: generateUniqueId(), name: "會偷偷幫你把所有飲料的吸管都咬扁，因為他覺得這樣比較好喝", type: "state", description: "Unsolicited straw modification." },
  { id: generateUniqueId(), name: "會把所有你丟掉的垃圾都撿回來，然後分類好再丟一次", type: "state", description: "Obsessive, second-hand recycling." },
  { id: generateUniqueId(), name: "會在你睡著時，幫你蓋上棉被", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "透過TikTok發布極端主義內容，吸引大量年輕追隨者", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "在你要睡覺時會在你耳邊學陶喆鬼叫", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "在下大雨的時候偷走你的雨傘", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "在你戴上耳機時會一職在你耳邊說話的人", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "把一屋子的窮人關起來進行器官移植還有...", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "她的口頭禪是「我有愛滋病」", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "穿上蜘蛛人的衣服為兒童醫院的小朋友加油打氣", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "總有一天會控制政府且比希特勒壞1000倍", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "如果他們死了你需要在超過1000人的喪禮上致詞", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "正在溜你的寵物", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "每次游泳時都會在游泳池裡偷尿尿", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "綁架了你的朋友且不會釋放他們除非你說服20人參加他們那白癡的募資專案", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "真真正正地在興奮", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "剛吸了一整罐噴漆所以準備要死掉了", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "正趕回家準備照顧寶寶", type: "state", description: "Playful, artistic sleep prank." },
  { id: generateUniqueId(), name: "身上有非常種族歧視的刺青", type: "state", description: "Playful, artistic sleep prank." },
];

const TrolleyProblemGame = () => {
  // Main game state
  const [gameState, setGameState] = useState('home'); // home, lobby, playing, ended
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isRoomHead, setIsRoomHead] = useState(false);
  const [isImpactAnimating, setIsImpactAnimating] = useState(false);
  const [impactedRailVisual, setImpactedRailVisual] = useState(null); // 'A' or 'B'
  const trainAudioRef = useRef(null);
  
  // Trolley game specific state
  const [gameData, setGameData] = useState(null);
  const [playerHand, setPlayerHand] = useState([]); // Current player's hand of card objects
  const [selectedStateCardToApply, setSelectedStateCardToApply] = useState(null); // New state for state card targeting

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const deleteRoom = async (code) => {
    try {
      await deleteDoc(doc(db, 'trolley_rooms', code));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const createRoom = async () => {
    if (!currentPlayer.trim()) return;
    
    const code = generateRoomCode();
    const roomRef = doc(db, "trolley_rooms", code);

    try {
      await setDoc(roomRef, {
        gameState: 'lobby',
        players: [currentPlayer],
        createdAt: Date.now(),
        trolley: null
      });

      setRoomCode(code);
      setIsRoomHead(true);
      setGameState('lobby');
    } catch (error) {
      console.error("Error creating room. Please try again.");
      alert("Error creating room. Please try again.");
    }
  };

  const joinRoom = async (code) => {
    if (!currentPlayer.trim() || !code.trim()) return;
    
    const roomRef = doc(db, "trolley_rooms", code);
    
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
          players: arrayUnion(currentPlayer)
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

  const assignRoles = async () => {
    if (!roomCode) return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const snap = await getDoc(roomRef);
    const roomData = snap.data();
    const roomPlayers = roomData.players; // Current players in the room
    const currentTrolleyData = roomData.trolley; // Get existing trolley data

    if (roomPlayers.length < 3) {
      alert('Need at least 3 players (1 driver + 2 teams)');
      return;
    }

    // --- Driver Selection Logic ---
    let nextDriver;
    const lastDriver = currentTrolleyData?.currentDriver;

    if (lastDriver && roomPlayers.includes(lastDriver)) {
        // If there was a last driver and they are still in the room
        const lastDriverIndex = roomPlayers.indexOf(lastDriver);
        nextDriver = roomPlayers[(lastDriverIndex + 1) % roomPlayers.length];
    } else {
        // First round, or last driver left, or last driver not found, pick a random starting driver
        const shuffledAvailablePlayers = [...roomPlayers].sort(() => Math.random() - 0.5);
        nextDriver = shuffledAvailablePlayers[0];
    }

    // Ensure the new driver isn't the same as the last *if possible and if there are enough players*
    // This is handled by the cyclical selection. If there's only 1 non-driver, they will be driver again.
    // With 3+ players, cyclical ensures a new driver each time until the cycle repeats.


    const remainingPlayers = roomPlayers.filter(p => p !== nextDriver); // Filter out the new driver for teams

    // Split remaining players into two teams as evenly as possible
    const teamASize = Math.ceil(remainingPlayers.length / 2);
    const teamA = remainingPlayers.slice(0, teamASize);
    const teamB = remainingPlayers.slice(teamASize);

    // --- NEW CARD GENERATION AND DISTRIBUTION LOGIC (Remains the same as our last discussion) ---

    const numNonDrivers = roomPlayers.length - 1; // This is (roomPlayers.length - 1) which is now correct
    const cardsPerPlayer = 9; // 3 good, 3 bad, 3 state cards

    let allAvailableCards = []; // Not used, can be removed

    const goodPeoplePool = [...ALL_GOOD_PEOPLE].map(card => ({ ...card, id: uuidv4() }));
    const badPeoplePool = [...ALL_BAD_PEOPLE].map(card => ({ ...card, id: uuidv4() }));
    const stateCardsPool = [...ALL_STATE_CARDS].map(card => ({ ...card, id: uuidv4() }));

    const shuffledGoodPeoplePool = [...goodPeoplePool].sort(() => Math.random() - 0.5);
    const shuffledBadPeoplePool = [...badPeoplePool].sort(() => Math.random() - 0.5);
    const shuffledStateCardsPool = [...stateCardsPool].sort(() => Math.random() - 0.5);

    const systemCardA = { ...shuffledGoodPeoplePool.shift(), systemPlaced: true, stateCardApplied: [] };
    const systemCardB = { ...shuffledGoodPeoplePool.shift(), systemPlaced: true, stateCardApplied: [] };

    const railA = [systemCardA];
    const railB = [systemCardB];

    const playerHands = {};
    let totalStateCardsCount = 0;

    const cardsForHands = [
      ...shuffledGoodPeoplePool.slice(0, numNonDrivers * 3),
      ...shuffledBadPeoplePool.slice(0, numNonDrivers * 3),
      ...shuffledStateCardsPool.slice(0, numNonDrivers * 3)
    ].sort(() => Math.random() - 0.5);

    let cardIndex = 0;
    roomPlayers.forEach(player => {
      if (player !== nextDriver) { // Use nextDriver here
        playerHands[player] = [];
        for (let i = 0; i < cardsPerPlayer; i++) {
          if (cardIndex < cardsForHands.length) {
            const cardToDeal = cardsForHands[cardIndex];
            playerHands[player].push(cardToDeal);
            if (cardToDeal.type === 'state') {
                totalStateCardsCount++;
            }
            cardIndex++;
          }
        }
      }
    });

    // --- END CARD GENERATION AND DISTRIBUTION LOGIC ---

    const currentScores = currentTrolleyData?.scores || {}; // Use currentTrolleyData
    const scores = Object.fromEntries(
      roomPlayers.map(p => [p, currentScores[p] !== undefined ? currentScores[p] : 5])
    );

    // --- NEW: Select Honest Player (from the non-driver players) ---
    const nonDriverPlayers = roomPlayers.filter(p => p !== nextDriver);
    let selectedHonestPlayer = null;
    if (nonDriverPlayers.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonDriverPlayers.length);
      selectedHonestPlayer = nonDriverPlayers[randomIndex];
    }
    // --- END NEW ---

    await updateDoc(roomRef, {
      'trolley': {
        currentDriver: nextDriver, // Update with the new driver
        teamA,
        teamB,
        railA,
        railB,
        scores,
        round: (currentTrolleyData?.round || 0) + 1, // Use currentTrolleyData for round
        selectedRail: null,
        roundPhase: 'building',
        playerHands: playerHands,
        totalStateCards: totalStateCardsCount,
        stateCardsUsed: 0,
        honestPlayer: selectedHonestPlayer, // Add honest player here
        listenerGuesses: {}, // Initialize listener guesses for the new round
      },
      'gameState': 'playing'
    });
  };

  // Helper to get card counts on a rail
  const getRailCardCounts = (rail) => {
    let goodCount = 0;
    let badCount = 0;
    rail.forEach(card => {
      if (card.type === 'person') {
        if (card.character === 'good') goodCount++;
        else if (card.character === 'bad') badCount++;
      }
    });
    return { goodCount, badCount };
  };

  const playPersonCard = async (cardObject) => {
    if (!roomCode || gameData.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const currentPlayerTeam = gameData.teamA.includes(currentPlayer) ? 'A' : 'B';
    const opponentTeam = currentPlayerTeam === 'A' ? 'B' : 'A';

    let railKeyToUpdate = null;
    let currentRailContent = null;
    
    const ownRailKey = `rail${currentPlayerTeam}`;
    const opponentRailKey = `rail${opponentTeam}`;
    const ownRail = gameData[ownRailKey];
    const opponentRail = gameData[opponentRailKey];

    const { goodCount: ownGoodCount, badCount: ownBadCount } = getRailCardCounts(ownRail);
    const { goodCount: oppGoodCount, badCount: oppBadCount } = getRailCardCounts(opponentRail);

    // Rule: Rail will only have 2 good person cards and 1 bad person card (total 3 person cards)
    // Remember one good person card is already placed by the system
    // So players can add 1 more good person card and 1 bad person card
    const currentPersonCardsOnOwnRail = ownRail.filter(card => card.type === 'person').length;
    const currentPersonCardsOnOpponentRail = opponentRail.filter(card => card.type === 'person').length;

    if (cardObject.character === 'good') {
      if (currentPersonCardsOnOwnRail >= 3 || ownGoodCount >= 2) {
        alert('Cannot add more good persons to your rail. Limit is 2 good persons and 3 total persons.');
        return;
      }
      railKeyToUpdate = ownRailKey;
      currentRailContent = ownRail;
    } else if (cardObject.character === 'bad') {
      // Rule: Bad person card will be put to the opponent rail
      if (currentPersonCardsOnOpponentRail >= 3 || oppBadCount >= 1) {
        alert('Cannot add more bad persons to opponent rail. Limit is 1 bad person and 3 total persons.');
        return;
      }
      railKeyToUpdate = opponentRailKey;
      currentRailContent = opponentRail;
    } else {
        return; // Should not happen for person cards
    }

    if (!railKeyToUpdate || !currentRailContent) return; // Should not happen if logic is sound

    // Remove the card from the current player's hand
    const updatedPlayerHand = gameData.playerHands[currentPlayer].filter(card => card.id !== cardObject.id);
    const updatedPlayerHands = {
        ...gameData.playerHands,
        [currentPlayer]: updatedPlayerHand
    };

    // Add stateCardApplied: null to the person card when it's initially placed
    const newPersonCardOnRail = { ...cardObject, stateCardApplied: [] };
    const newRail = [...currentRailContent, newPersonCardOnRail];
    
    // Update the specific rail and player hands in the database
    await updateDoc(roomRef, {
      [`trolley.${railKeyToUpdate}`]: newRail,
      'trolley.playerHands': updatedPlayerHands
    });

    // Check if both rails are complete (3 person cards each) AND all state cards are used
    const railA = railKeyToUpdate === 'railA' ? newRail : gameData.railA;
    const railB = railKeyToUpdate === 'railB' ? newRail : gameData.railB;

    if (railA.length === 3 && railB.length === 3 && gameData.stateCardsUsed === gameData.totalStateCards) {
      // Both rails complete and all state cards used, driver can now decide
      await updateDoc(roomRef, {
        'trolley.roundPhase': 'deciding'
      });
    }
  };

  const initiateStateCardTargeting = (stateCard) => {
    if (gameData?.roundPhase !== 'building') return;
    setSelectedStateCardToApply(stateCard);
  };

  const applyStateCardToPerson = async (targetRailKey, targetCardId) => {
    if (!roomCode || !selectedStateCardToApply || gameData.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);

    // Fetch the latest game data directly before updating to avoid stale state
    const docSnap = await getDoc(roomRef); // Use getDoc to fetch the latest state
    if (!docSnap.exists()) {
      alert("Room does not exist.");
      setSelectedStateCardToApply(null);
      return;
    }

    const latestGameData = docSnap.data().trolley; // Get the latest 'trolley' object
    let currentRail = latestGameData[targetRailKey]; // Use the latest rail data
    let currentPlayerHands = { ...latestGameData.playerHands };


    const targetCardIndex = currentRail.findIndex(card => card.id === targetCardId && card.type === 'person');

    if (targetCardIndex === -1) {
      alert("Selected card is not a valid target or not found.");
      setSelectedStateCardToApply(null);
      return;
    }

    const targetPersonCard = currentRail[targetCardIndex];
    const appliedStateCards = targetPersonCard.stateCardApplied || [];

    // Check if this specific state card is already applied to this person
    const alreadyApplied = appliedStateCards.some(
      (appliedCard) => appliedCard.id === selectedStateCardToApply.id
    );

    if (alreadyApplied) {
        alert("This specific state card is already applied to this person.");
        setSelectedStateCardToApply(null);
        return;
    }

    // Construct the updated person card
    const updatedPersonCard = {
      ...targetPersonCard,
      stateCardApplied: [...appliedStateCards, selectedStateCardToApply],
    };

    // Construct the updated rail array
    const updatedRail = [...currentRail];
    updatedRail[targetCardIndex] = updatedPersonCard;

    // Remove the state card from the player's hand
    const updatedPlayerHand = currentPlayerHands[currentPlayer].filter(
      (card) => card.id !== selectedStateCardToApply.id
    );
    currentPlayerHands[currentPlayer] = updatedPlayerHand;

    // Perform the update
    await updateDoc(roomRef, {
      [`trolley.${targetRailKey}`]: updatedRail, // Update the entire rail array
      'trolley.playerHands': currentPlayerHands, // Update the entire playerHands object
      'trolley.stateCardsUsed': latestGameData.stateCardsUsed + 1,
    });

    setSelectedStateCardToApply(null); // Exit targeting mode
  };

  // Function to remove a person card from the rail and return to hand
  const removePersonCardFromRail = async (railKey, cardId) => {
    if (!roomCode || gameData.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const currentRail = gameData[railKey];

    // Find the index and the card object
    const cardIndex = currentRail.findIndex(card => card.id === cardId && card.type === 'person');
    if (cardIndex === -1) {
        alert("Card not found on this rail.");
        return;
    }
    const cardToRemove = currentRail[cardIndex];

    // --- Prevent removal if card is systemPlaced ---
    if (cardToRemove.systemPlaced) {
        alert("This card was placed by the system and cannot be removed.");
        return;
    }

    // Add confirmation dialog
    const confirmed = window.confirm("Do you really want to remove this card?");
    if (!confirmed) {
        return; // User cancelled
    }

    // Determine the current player's team
    const currentPlayerTeam = gameData.teamA.includes(currentPlayer) ? 'A' : 'B';

    // Determine which team placed this specific card
    let cardPlacingTeam;
    const railTeam = railKey === 'railA' ? 'A' : 'B'; // Team that 'owns' this rail

    if (cardToRemove.character === 'good') {
        // Good cards are always placed by the team whose rail it is
        cardPlacingTeam = railTeam;
    } else if (cardToRemove.character === 'bad') {
        // Bad cards are placed by the *opponent* team onto this rail
        cardPlacingTeam = railTeam === 'A' ? 'B' : 'A';
    } else {
        alert("Invalid card type for removal.");
        return;
    }

    // Verify if the current player belongs to the team that placed this card
    if (currentPlayerTeam !== cardPlacingTeam) {
        alert("You can only remove cards that *your team* has placed.");
        return;
    }

    // Remove card from rail
    const updatedRail = currentRail.filter(card => card.id !== cardId);

    // Add card back to player's hand (without the stateCardApplied property, as state card effect is tied to its presence on rail)
    const cardForHand = {
        id: cardToRemove.id,
        name: cardToRemove.name,
        type: cardToRemove.type,
        character: cardToRemove.character,
        stateCardApplied: [] // Reset state cards when returning to hand
    };
    const updatedPlayerHand = [...gameData.playerHands[currentPlayer], cardForHand];
    const updatedPlayerHands = {
        ...gameData.playerHands,
        [currentPlayer]: updatedPlayerHand
    };

    await updateDoc(roomRef, {
        [`trolley.${railKey}`]: updatedRail,
        'trolley.playerHands': updatedPlayerHands
    });
    alert(`"${cardToRemove.name}" removed from rail and returned to your hand.`);
  };

  const chooseRail = async (rail) => {
    if (!roomCode || gameData.roundPhase !== 'deciding') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const scores = { ...gameData.scores };

    // Players from the chosen rail lose 1 point
    const losers = rail === 'A' ? gameData.teamA : gameData.teamB;
    losers.forEach(player => {
      scores[player] = (scores[player] || 0) - 1;
    });

    // Check if any player has score below 0 (game ends)
    const gameOver = Object.values(scores).some(score => score < 0);

    // Update the database immediately
    await updateDoc(roomRef, {
      'trolley.scores': scores,
      'trolley.selectedRail': rail,
      'trolley.roundPhase': 'completed',
      'gameState': gameOver ? 'ended' : 'playing'
    });
  };

  const startNextRound = async () => {
    await assignRoles();
  };

  // New function for driver to force decision
  const forceDriverDecision = async () => {
    if (!roomCode || !isDriver || gameData?.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    await updateDoc(roomRef, {
      'trolley.roundPhase': 'deciding'
    });
  };

  const leaveRoom = async () => {
    if (!roomCode || !currentPlayer) return;
    
    const roomRef = doc(db, 'trolley_rooms', roomCode);
    
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
      
      let updateData = {
        players: updatedPlayers
      };
      
      // Handle game state updates if in a game
      if (data.gameState === 'playing' && data.trolley) {
        let needsNewRound = false;
        
        // If the driver left
        if (data.trolley.currentDriver === currentPlayer) {
          needsNewRound = true;
        }
        
        // If a team member left
        if (data.trolley.teamA.includes(currentPlayer) || data.trolley.teamB.includes(currentPlayer)) {
          needsNewRound = true;
        }
        
        // If we need a new round but don't have enough players
        if (needsNewRound && updatedPlayers.length < 3) {
          updateData.gameState = 'lobby';
          updateData.trolley = null;
        } else if (needsNewRound) {
          // We'll need to restart the round after updating players
          updateData.gameState = 'lobby';
          updateData.trolley = null;
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
    setGameData(null);
    setPlayerHand([]); // Reset player hand on leaving
    setSelectedStateCardToApply(null); // Reset state card targeting
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

  // Firebase listener
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayers(data.players || []);
        setGameState(data.gameState || 'lobby');
        setGameData(data.trolley);
        
        // Update current player's hand when gameData changes
        if (data.trolley?.playerHands && data.trolley.playerHands[currentPlayer]) {
            setPlayerHand(data.trolley.playerHands[currentPlayer]);
        } else {
            setPlayerHand([]); // Clear hand if not in game or no hand assigned
        }

        // Check if current player is room head (first player)
        if (data.players && data.players.length > 0) {
          setIsRoomHead(currentPlayer === data.players[0]);
        }
      } else {
        // Room was deleted or no longer exists
        resetLocalState();
      }
    });

    return () => unsub();
  }, [roomCode, currentPlayer]);

  // New useEffect for managing train impact animation and sound
  useEffect(() => {
    // Check if a rail has been selected and the round is completed
    if (gameData?.selectedRail && gameData.roundPhase === 'completed') {
        const railChosen = gameData.selectedRail;
        const isCurrentPlayerOnImpactedTeam =
            (railChosen === 'A' && gameData.teamA.includes(currentPlayer)) ||
            (railChosen === 'B' && gameData.teamB.includes(currentPlayer));

        // Only trigger animation for players on the impacted team AND the driver
        // (The driver also needs to see the impact effect for the rail they chose)
        if (isCurrentPlayerOnImpactedTeam || currentPlayer === gameData.currentDriver) {
            setImpactedRailVisual(railChosen);
            setIsImpactAnimating(true);
            if (trainAudioRef.current) {
              trainAudioRef.current.play().catch(error => {
                console.error("Error playing train sound: ", error);
              })
            }

            // Set a timeout to end the animation and clear the visual state
            setTimeout(() => {
                setIsImpactAnimating(false);
                setImpactedRailVisual(null);
                if (trainAudioRef.current) {
                  trainAudioRef.current.pause();
                  trainAudioRef.current.currentTime = 0;
                }
            }, 3000); // Animation duration (1.5 seconds)
        }
    }
    // Dependency array: re-run when gameData.selectedRail, gameData.roundPhase,
    // gameData.teamA, gameData.teamB, gameData.currentDriver, or currentPlayer changes.
    // Ensure all variables from gameData used inside the effect are in the dependency array.
  }, [gameData?.selectedRail, gameData?.roundPhase, gameData?.teamA, gameData?.teamB, gameData?.currentDriver, currentPlayer]);

  // Home screen
  if (gameState === 'home') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.card}>
            <h1 className={styles.title}>🚂 電車難題-最終審判</h1>
            <p className={`${styles.subtitle} ${styles.textGray}`}>Find out what you really concern</p>
            
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
            司機: 選擇要衝撞的軌道。<br />
            玩家: 根據自己的隊伍擺上好人卡與壞人卡，並在最終加上特性卡。<br />
            請示著保護自己的軌道。<br />
            在按一次卡片能收回卡牌，但注意特性卡無法收回。
            </p>
        </div>
      </div>
    );
  }

  // Lobby screen
  if (gameState === 'lobby') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.cardSmall}>
            <div className={`${styles.textCenter} ${styles.mb6}`}>
              <h2 className={styles.heading}>🚂 Room: {roomCode}</h2>
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
                onClick={assignRoles}
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
            司機: 選擇要衝撞的軌道。<br />
            玩家: 根據自己的隊伍擺上好人卡與壞人卡，並在最終加上特性卡。<br />
            請示著保護自己的軌道。<br />
            在按一次卡片能收回卡牌，但注意特性卡無法收回。
            </p>
        </div>
      </div>
    );
  }

  if (!gameData && gameState === 'playing') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidth2xl}>
          <div className={styles.cardSmall}>
            <h2 className={styles.heading}>Trolley Problem Game</h2>
            <p className={styles.textGray}>Setting up game...</p>
          </div>
        </div>
      </div>
    );
  }

  const isDriver = currentPlayer === gameData?.currentDriver;
  const isTeamA = gameData?.teamA.includes(currentPlayer);
  const Team = isTeamA ? 'A':'B';
  const isTeamB = gameData?.teamB.includes(currentPlayer);

  // Game ended screen
  if (gameState === 'ended') {
    const winner = Object.entries(gameData?.scores || {}).find(([_, score]) => score >= 0);
    const losers = Object.entries(gameData?.scores || {}).filter(([_, score]) => score < 0);
    const rankings = Object.entries(gameData?.scores || {}).sort((a, b) => b[1] - a[1]);
    
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={`${styles.card} ${styles.textCenter}`}>
            <div className={styles.mb6}>
              <Award className={styles.iconLarge} />
              <h2 className={styles.heading}>🚂 Game Over!</h2>
              <p className={styles.textGray}>Final Results</p>
            </div>
            
            <div className={`${styles.spaceY3} ${styles.mb6}`}>
              <h3 className={styles.subheading}>Final Scores</h3>
              {rankings.map(([player, score], index) => (
                <div key={player} className={`${styles.rankingItem} ${
                  index === 0 ? styles.rankingFirst :
                  index === 1 ? styles.rankingSecond :
                  index === 2 ? styles.rankingThird :
                  styles.rankingOther
                }`}>
                  <div className={styles.left}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{player}</span>
                  </div>
                  <span className={`${styles.score} ${score < 0 ? styles.textRed : styles.textGreen}`}>
                    {score} {score < 0 ? '(Eliminated)' : ''}
                  </span>
                </div>
              ))}
            </div>

            {losers.length > 0 && (
              <p className={styles.textGray}>
                {losers.map(([name]) => name).join(', ')} eliminated!
              </p>
            )}

            {isRoomHead && (
              <button
                onClick={resetAndEndGame}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <RotateCcw className={styles.icon} />
                Play Again
              </button>
            )}
            
            {!isRoomHead && (
              <button
                onClick={resetGame}
                className={`${styles.button} ${styles.buttonGray}`}
              >
                Leave Room
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <audio ref={trainAudioRef} src="/assets/trainScream.m4a" preload="auto" />
      <div className={styles.maxWidth2xl}>
        <div className={styles.cardSmall}>
          <div className={`${styles.textCenter} ${styles.mb4}`}>
            <h2 className={styles.heading}>🚂 電車難題_最終審判 - Round {gameData?.round}</h2>
            <p className={styles.textGray}>Room: {roomCode}</p>
          </div>
          
          <div className={`${styles.spaceY2} ${styles.mb4}`}>
            <p className={styles.textGray}>👨‍✈️ 司機: <strong>{gameData?.currentDriver}</strong></p>
            <p className={styles.textGray}>👥 Team A: {gameData?.teamA.join(', ')}</p>
            <p className={styles.textGray}>👥 Team B: {gameData?.teamB.join(', ')}</p>
          </div>

          {/* Rails Display */}
          {/* rail A */}
          <div className={`${styles.spaceY3} ${styles.mb4}`}>
            <div className={styles.railDisplayContainer}>
              <h3 className={styles.subheading}>🚉 軌道 A ({gameData?.railA.length}/3)</h3>
              <div className="flex gap-2 flex-wrap">
                {gameData?.railA.map((card) => {
                  // Determine if this specific card is removable by the current player
                  const isRemovable =
                      gameData?.roundPhase === 'building' && // Must be in building phase
                      card.type === 'person' && // Must be a person card
                      !card.systemPlaced && // NEW: System-placed cards are not removable
                      (
                          (card.character === 'good' && gameData.teamA.includes(currentPlayer)) || // Good card on Rail A, removable by Team A
                          (card.character === 'bad' && gameData.teamB.includes(currentPlayer))     // Bad card on Rail A (placed by Team B), removable by Team B
                      );

                  return (
                    <div
                      key={card.id}
                      className={`${styles.personCard} ${card.character === 'good' ? styles.goodPersonCard : styles.badPersonCard} ${card.systemPlaced ? styles.systemPlacedCard : ''} ${selectedStateCardToApply && card.type === 'person' ? styles.targetableCard : ''} ${isRemovable ? styles.removableCard : ''}`}
                      onClick={() => {
                          if (selectedStateCardToApply && card.type === 'person') {
                              applyStateCardToPerson('railA', card.id); // Or 'railB'
                          } else if (isRemovable) {
                              removePersonCardFromRail('railA', card.id); // Or 'railB'
                          }
                      }}
                    >
                      {card.character === 'good' ? '😃' : '🤬'} {card.name}
                      {/* NEW: Iterate over the stateCardApplied array */}
                      {(card.stateCardApplied || []).map((appliedStateCard, idx) => (
                          <div key={idx} className={styles.stateCardAppliedBadge}>
                              📜 {appliedStateCard.name}
                          </div>
                      ))}
                    </div>
                  );
                })}
                {Array(3 - (gameData?.railA.length || 0)).fill(null).map((_, index) => (
                  <div key={`empty-a-${index}`} className={`${styles.personCard} ${styles.emptyPersonCard}`}>
                    empty
                  </div>
                ))}
              </div>
                {isImpactAnimating && impactedRailVisual === 'A' && (
                   <div className={`${styles.trainImpactIcon} ${isImpactAnimating ? styles.animate : ''}`}>
                       🚆
                   </div>
                )}
            </div>
            {/* rail B */}
            <div className={styles.railDisplayContainer}>
              <h3 className={styles.subheading}>🚉 軌道 B ({gameData?.railB.length}/3)</h3>
              <div className="flex gap-2 flex-wrap">
                {gameData?.railB.map((card) => {
                  // Determine if this specific card is removable by the current player
                  const isRemovable =
                      gameData?.roundPhase === 'building' && // Must be in building phase
                      card.type === 'person' && // Must be a person card
                      !card.systemPlaced && // NEW: System-placed cards are not removable
                      (
                          (card.character === 'good' && gameData.teamB.includes(currentPlayer)) || // Good card on Rail B, removable by Team B
                          (card.character === 'bad' && gameData.teamA.includes(currentPlayer))     // Bad card on Rail B (placed by Team A), removable by Team A
                      );

                  return (
                    <div
                      key={card.id}
                      className={`${styles.personCard} ${card.character === 'good' ? styles.goodPersonCard : styles.badPersonCard} ${card.systemPlaced ? styles.systemPlacedCard : ''} ${selectedStateCardToApply && card.type === 'person' ? styles.targetableCard : ''} ${isRemovable ? styles.removableCard : ''}`}
                      onClick={() => {
                          if (selectedStateCardToApply && card.type === 'person') {
                              applyStateCardToPerson('railB', card.id);
                          } else if (isRemovable) {
                              removePersonCardFromRail('railB', card.id); 
                          }
                      }}
                    >
                      {card.character === 'good' ? '😃' : '🤬'} {card.name}
                      {/* NEW: Iterate over the stateCardApplied array */}
                      {(card.stateCardApplied || []).map((appliedStateCard, idx) => (
                          <div key={idx} className={styles.stateCardAppliedBadge}>
                              📜 {appliedStateCard.name}
                          </div>
                      ))}
                    </div>
                  );
                })}
                {Array(3 - (gameData?.railB.length || 0)).fill(null).map((_, index) => (
                  <div key={`empty-b-${index}`} className={`${styles.personCard} ${styles.emptyPersonCard}`}>
                    empty
                  </div>
                ))}
              </div>
                {isImpactAnimating && impactedRailVisual === 'B' && (
                    <div className={`${styles.trainImpactIcon} ${isImpactAnimating ? styles.animate : ''}`}>
                        🚆
                    </div>
                )}
            </div>
          </div>

          {/* Driver Decision */}
          {isDriver && gameData?.roundPhase === 'deciding' && (
            <div className={`${styles.spaceY3} ${styles.mb4}`}>
              <h3 className={styles.subheading}>🚂 選擇要衝撞哪條軌道:</h3>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => chooseRail('A')}
                  className={`${styles.button} ${styles.buttonWarning}`}
                >
                  💥 衝撞軌道 A
                </button>
                <button
                  onClick={() => chooseRail('B')}
                  className={`${styles.button} ${styles.buttonWarning}`}
                >
                  💥 衝撞軌道 B
                </button>
              </div>
            </div>
          )}

          {/* Driver's "Call for Decision" button */}
          {isDriver && gameData?.roundPhase === 'building' && (
            <div className={`${styles.textCenter} ${styles.mb4}`}>
              <button
                onClick={forceDriverDecision}
                className={`${styles.button} ${styles.buttonWarning}`}
              >
                宣告:做出審判
              </button>
            </div>
          )}

          {/* Player Actions (Team A or Team B) */}
          {(isTeamA || isTeamB) && gameData?.roundPhase === 'building' && (
            <div className={`${styles.spaceY2} ${styles.mb4}`}>
              <h3 className={styles.subheading}>你的隊伍: {Team}, 你的手牌:</h3>
              <div className="flex gap-2 justify-center flex-wrap">
                {playerHand.map((card) => {
                  let buttonClass = styles.buttonSecondary;
                  let buttonText = card.name;
                  let disabled = false;
                  let onClickHandler = null;

                  if (card.type === 'person') {
                    buttonClass = `${styles.buttonSecondary} ${card.character === 'good' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`;
                    buttonText = `${card.character === 'good' ? '😃' : '🤬'} ${card.name}`;
                    
                    const ownRail = isTeamA ? gameData.railA : gameData.railB;
                    const opponentRail = isTeamA ? gameData.railB : gameData.railA;
                    const { goodCount: ownGoodCount, badCount: ownBadCount } = getRailCardCounts(ownRail);
                    const { goodCount: oppGoodCount, badCount: oppBadCount } = getRailCardCounts(opponentRail);

                    // Note: Rail length limit is now 3, with 1 system-placed good card initially
                    const currentPersonCardsOnOwnRail = ownRail.filter(card => card.type === 'person').length;
                    const currentPersonCardsOnOpponentRail = opponentRail.filter(card => card.type === 'person').length;

                    if (card.character === 'good') {
                        disabled = currentPersonCardsOnOwnRail >= 3 || ownGoodCount >= 2;
                        onClickHandler = () => playPersonCard(card);
                    } else if (card.character === 'bad') {
                        disabled = currentPersonCardsOnOpponentRail >= 3 || oppBadCount >= 1;
                        onClickHandler = () => playPersonCard(card);
                    }
                  } else if (card.type === 'state') {
                    buttonClass = `${styles.buttonSecondary} bg-blue-200 text-blue-900 ${selectedStateCardToApply?.id === card.id ? styles.selectedCardForTargeting : ''}`;
                    buttonText = `📜 ${card.name}`;
                    // Disable if already targeting another card, or if it's the card currently selected for targeting
                    disabled = !!selectedStateCardToApply && selectedStateCardToApply.id !== card.id;
                    onClickHandler = () => {
                      if (selectedStateCardToApply?.id === card.id) {
                        setSelectedStateCardToApply(null); // Deselect if already selected
                      } else {
                        initiateStateCardTargeting(card);
                      }
                    };
                  }

                  return (
                    <button
                      key={card.id}
                      onClick={onClickHandler}
                      disabled={disabled || gameData?.roundPhase !== 'building'}
                      className={buttonClass}
                    >
                      {buttonText}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {selectedStateCardToApply && (
            <div className={`${styles.textCenter} ${styles.mt-2} ${styles.mb4}`}>
                <p className={styles.textGray}>
                    請選擇一張牌來施加特性 "<strong className={styles.textBlue}>{selectedStateCardToApply.name}</strong>"
                    <button onClick={() => setSelectedStateCardToApply(null)} className={styles.cancelButton}>取消</button>
                </p>
            </div>
          )}

          {/* Game Status */}
          <div className={`${styles.mb4} ${styles.textCenter}`}>
            {gameData?.roundPhase === 'building' && (
              <p className={styles.textGray}>
                Teams are building their rails... (Total person cards placed: {(gameData?.railA.length || 0) + (gameData?.railB.length || 0)}/6)
                {gameData?.totalStateCards !== undefined && (
                    <span> | State cards used: {gameData.stateCardsUsed}/{gameData.totalStateCards}</span>
                )}
              </p>
            )}

            {gameData?.roundPhase === 'deciding' && !isDriver && (
              <p className={styles.textGray}>
                ⏳ Waiting for {gameData?.currentDriver} to make their decision...
              </p>
            )}

            {gameData?.selectedRail && (
              <div className={`${styles.spaceY2} ${styles.textCenter}`}>
                <h3 className={styles.subheading}>💥 Decision Made!</h3>
                <p>列車選擇撞向 {gameData?.selectedRail}!</p>
                <p>Team {gameData?.selectedRail} 玩家距離地獄靠近了一步.</p>
              </div>
            )}
          </div>

          {/* Scores */}
          <div className={`${styles.spaceY2} ${styles.mb4}`}>
            <h3 className={`${styles.subheading} ${styles.textCenter}`}>🔥 大家與地獄的距離</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(gameData?.scores || {})
                .sort((a, b) => b[1] - a[1])
                .map(([player, score]) => (
                  <div key={player} className={`p-2 rounded text-center ${score < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    <strong>{player}</strong>: {score}
                  </div>
                ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className={`${styles.textCenter} ${styles.spaceY3}`}>
            {/* Next Round Button */}
            {isRoomHead && gameData?.roundPhase === 'completed' && gameState !== 'ended' && (
              <button
                onClick={startNextRound}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                Start Next Round
              </button>
            )}

            {/* Leave Room Button */}
            <button
              onClick={leaveRoom}
              className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrolleyProblemGame;