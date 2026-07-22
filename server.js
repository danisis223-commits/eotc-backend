const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const JWT_SECRET = 'eotc_edutech_secret_2026';

app.use(express.static('/storage/emulated/0/eotc-frontend'));
app.use(express.json());

// ---------- የውሂብ ፋይሎች ----------
const BOOKS_FILE = path.join(__dirname, 'books.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const USER_BOOKS_FILE = path.join(__dirname, 'userBooks.json');

// ---------- የመጻሕፍት ውሂብ ጫን ----------
let books = [];
if (fs.existsSync(BOOKS_FILE)) {
    books = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8'));
} else {
    books = [
        { id: 1, title: 'መጽሐፈ ኦሪት', category: 'ቅዱሳት መጻሕፍት' },
        { id: 2, title: 'ወንጌል ዘማቴዎስ', category: 'ቅዱሳት መጻሕፍት' },
        { id: 3, title: 'መጽሐፈ ሰዓታት', category: 'የአምልኮ መጻሕፍት' },
        { id: 4, title: 'መጽሐፈ ነቢያት', category: 'ቅዱሳት መጻሕፍት' },
        { id: 5, title: 'መጽሐፈ ድንግል ማርያም', category: 'የአምልኮ መጻሕፍት' },
        { id: 6, title: 'መጽሐፈ መክብብ', category: 'ቅዱሳት መጻሕፍት' },
        { id: 7, title: 'መዝሙረ ዳዊት', category: 'ቅዱሳት መጻሕፍት' },
        { id: 8, title: 'የሐዋርያት ሥራ', category: 'ቅዱሳት መጻሕፍት' },
        { id: 9, title: 'መጽሐፈ ሄኖክ', category: 'ቅዱሳት መጻሕፍት' },
        { id: 10, title: 'መጽሐፈ ጽርሐ አርያም', category: 'የአምልኮ መጻሕፍት' },
        { id: 11, title: 'የአባቶች ትምህርት (ሃይማኖተ አበው)', category: 'እምነትና ትምህርት' },
        { id: 12, title: 'የቤተክርስቲያን ታሪክ', category: 'ስለ ቤተክርስቲያን' },
        { id: 13, title: 'ቅዳሴ ማርያም', category: 'ሥርዓተ አምልኮ' },
        { id: 14, title: 'ጾምና በዓላት', category: 'ሥርዓተ አምልኮ' },
        { id: 15, title: 'ማኅቶተ ዝማሬ', category: 'የአገልግሎት መጻሕፍት' }
    ];
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));
}

// ---------- የተጠቃሚዎች ውሂብ ጫን ----------
let users = [];
if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// ---------- የተጠቃሚዎች የግል መጻሕፍት ውሂብ ጫን ----------
let userBooks = {};
if (fs.existsSync(USER_BOOKS_FILE)) {
    userBooks = JSON.parse(fs.readFileSync(USER_BOOKS_FILE, 'utf8'));
}

// ---------- JWT ማጣራት መሳሪያ ----------
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) return res.status(401).json({ error: 'ቶከን ያስፈልጋል' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'ቶከን ልክ ያልሆነ ወይም ጊዜው ያለፈበት' });
        req.user = user;
        next();
    });
}

// ---------- ዋና ገጽ ----------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) res.status(404).send('index.html አልተገኘም።');
    });
});

// ---------- የመጻሕፍት መንገዶች (ለሁሉም የሚታዩ) ----------
app.get('/api/contents', (req, res) => {
    res.json(books);
});

app.post('/api/contents', (req, res) => {
    const { title, category } = req.body;
    if (!title || !category) {
        return res.status(400).json({ error: 'ርዕስና ምድብ ያስፈልጋሉ' });
    }
    const newBook = { id: books.length + 1, title, category };
    books.push(newBook);
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));
    res.status(201).json(newBook);
});

// ---------- የተጠቃሚ መለያ ----------
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'የተጠቃሚ ስም እና የይለፍ ቃል ያስፈልጋሉ' });
    }
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'ይህ የተጠቃሚ ስም አስቀድሞ ተይዟል' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.status(201).json({ message: 'ተመዝግበዋል!', userId: newUser.id });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'የተጠቃሚ ስም እና የይለፍ ቃል ያስፈልጋሉ' });
    }
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'በተሳካ ሁኔታ ገብተዋል!', token });
});

// ---------- የግል መጽሐፍ መደርደሪያ (Authentication ያስፈልጋል) ----------
app.get('/api/mybooks', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const myBooks = userBooks[userId] || [];
    res.json(myBooks);
});

app.post('/api/mybooks', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { title, category } = req.body;
    if (!title || !category) {
        return res.status(400).json({ error: 'ርዕስና ምድብ ያስፈልጋሉ' });
    }
    if (!userBooks[userId]) {
        userBooks[userId] = [];
    }
    const newBook = { id: userBooks[userId].length + 1, title, category };
    userBooks[userId].push(newBook);
    fs.writeFileSync(USER_BOOKS_FILE, JSON.stringify(userBooks, null, 2));
    res.status(201).json(newBook);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ አገልጋይ በ http://localhost:${port}`);
});
