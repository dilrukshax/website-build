
Scope of the theme ~
I want to develop a marketing landing page theme with below sections. add a proper name for the theme. do not use version ids in for the section names (ex: v1, v2)


Here are the sections i seek ~

hero - header (bold), sub header, a video, 2 buttons (1 primary, 2 secondary)
testimonials - What people are saying - scrollable grid view
services - demonstrating feature by feature
faq
footer

UI theme guidelines ~
do not use the contents, labels, text, icons mentioned in any of the below sections. instead use generic names.

## 1. Global Styles

### Color Palette
- **Primary Background**: #0B1121 (deep navy blue)
- **Card Background**: #151F38 (slightly lighter navy)
- **Header Background**: #131B2E (dark navy with slight transparency)
- **Primary Button**: #FFFFFF (white)
- **Secondary Button**: #6366F1 (indigo/purple)
- **Primary Text**: #FFFFFF (white)
- **Secondary Text**: #A0AEC0 (muted gray-blue)
- **Accent Blue**: #3B82F6 (bright blue for numbers)
- **Accent Purple**: #8B5CF6 (purple for stats)
- **Accent Cyan**: #06B6D4 (cyan for stats)
- **Success Green**: #10B981 (for percentage increases)
- **Logo Gradient Start**: #8B5CF6 (purple)
- **Logo Gradient End**: #EC4899 (pink)
- **Card Border**: rgba(99, 102, 241, 0.3) (semi-transparent indigo)
- **Card Glow**: rgba(99, 102, 241, 0.15)
- **Logo Bar Background**: #111827 (dark gray-blue)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Logo Text**: 24px, font-weight: 600, color: #FFFFFF
- **Navigation Links**: 16px, font-weight: 500, color: #FFFFFF
- **Hero Eyebrow Text**: 16px, font-weight: 400, color: #A0AEC0
- **Hero Heading**: 56px, font-weight: 700, line-height: 1.1, color: #FFFFFF
- **Hero Subheading**: 20px, font-weight: 400, line-height: 1.5, color: #A0AEC0
- **Primary Button Text**: 16px, font-weight: 600, color: #0B1121
- **Secondary Button Text**: 16px, font-weight: 500, color: #FFFFFF
- **Stat Card Label**: 16px, font-weight: 400
- **Stat Card Number**: 48px, font-weight: 700
- **Stat Card Percentage**: 14px, font-weight: 500
- **Logo Bar Company Names**: 18px, font-weight: 600, color: #6B7280

### Spacing Scale
- 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 120px

### Border Radiuses
- **Buttons**: 8px
- **Header Container**: 60px (pill shape)
- **Stat Cards**: 16px
- **Avatar Images**: 50% (circle)
- **Logo Bar**: 12px

### Shadows
- **Header Shadow**: 0 4px 30px rgba(0, 0, 0, 0.3)
- **Stat Cards Shadow**: 0 8px 32px rgba(99, 102, 241, 0.2)
- **Card Glow Effect**: 0 0 60px rgba(99, 102, 241, 0.3)

---

## 2. Layout Structure

### Overall Container
- **Max-width**: 1280px
- **Horizontal Padding**: 40px
- **Centered**: margin: 0 auto

### Page Sections (Top to Bottom)
1. **Header/Navigation**: height: 72px, fixed/sticky
2. **Hero Section**: min-height: 540px, padding-top: 120px
3. **Logo Bar Section**: height: 80px, margin-top: 64px

---

## 3. Section-by-Section Breakdown

### Header/Navigation

**Container**
- Width: 100%
- Position: fixed, top: 24px
- Z-index: 1000

**Inner Header Bar**
- Max-width: 1100px
- Height: 64px
- Background: rgba(19, 27, 46, 0.9)
- Backdrop-filter: blur(12px)
- Border-radius: 60px
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Padding: 0 8px 0 20px
- Display: flex
- Align-items: center
- Justify-content: space-between
- Margin: 0 auto

**Logo Section**
- Display: flex
- Align-items: center
- Gap: 12px

**Logo Icon**
- Width: 40px
- Height: 40px
- Background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)
- Border-radius: 10px
- Display: flex
- Align-items: center
- Justify-content: center
- Contains "N" letter in white, stylized

**Logo Text**
- Content: "NovaCrest"
- Font-size: 22px
- Font-weight: 600
- Color: #FFFFFF

**Navigation Links Container**
- Display: flex
- Gap: 32px
- Align-items: center

**Navigation Links**
- Font-size: 16px
- Font-weight: 500
- Color: #FFFFFF
- Text-decoration: none
- Items:
  - "Product"
  - "Resources" (with dropdown chevron icon, 12px)
  - "Pricing"
  - "Customers"
  - "Blog"
  - "Contact"

**Right Side Actions**
- Display: flex
- Gap: 12px
- Align-items: center

**Log in Link**
- Font-size: 16px
- Font-weight: 500
- Color: #FFFFFF
- Padding: 10px 16px

**Sign up Button**
- Background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
- Color: #FFFFFF
- Font-size: 16px
- Font-weight: 600
- Padding: 12px 24px
- Border-radius: 8px
- Border: none

---

### Hero Section

**Container**
- Display: flex
- Justify-content: space-between
- Align-items: center
- Padding-top: 120px
- Gap: 60px

**Left Content**
- Max-width: 560px
- Flex: 1

**Social Proof Row**
- Display: flex
- Align-items: center
- Gap: 16px
- Margin-bottom: 24px

**Avatar Stack**
- Display: flex
- Margin-left: -8px (for overlap)

**Individual Avatar**
- Width: 40px
- Height: 40px
- Border-radius: 50%
- Border: 2px solid #0B1121
- Margin-left: -12px (except first)
- Object-fit: cover
- 4 avatars showing diverse faces

**Social Proof Text**
- Content: "Join 15,725 + other loving customers"
- Font-size: 16px
- Font-weight: 400
- Color: #A0AEC0

**Main Heading**
- Content: "Revolutionising business through the power of AI"
- Font-size: 56px
- Font-weight: 700
- Line-height: 1.1
- Color: #FFFFFF
- Margin-bottom: 24px
- Letter-spacing: -0.02em

**Subheading**
- Content: "Smarter decisions and faster growth with AI."
- Font-size: 20px
- Font-weight: 400
- Line-height: 1.6
- Color: #A0AEC0
- Margin-bottom: 40px

**Button Row**
- Display: flex
- Gap: 16px
- Align-items: center

**Create Account Button (Primary)**
- Background: #FFFFFF
- Color: #0B1121
- Font-size: 16px
- Font-weight: 600
- Padding: 16px 28px
- Border-radius: 8px
- Border: none
- Cursor: pointer

**Introducing Sub Teams Button (Secondary)**
- Background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)
- Border: 1px solid rgba(99, 102, 241, 0.5)
- Color: #FFFFFF
- Font-size: 16px
- Font-weight: 500
- Padding: 16px 24px
- Border-radius: 8px
- Display: flex
- Align-items: center
- Gap: 8px
- Contains right arrow icon (chevron-right, 16px)

---

### Hero Right - Stat Cards

**Cards Container**
- Position: relative
- Width: 520px
- Height: 460px

**Card Base Styles**
- Background: rgba(21, 31, 56, 0.8)
- Border: 1px solid rgba(99, 102, 241, 0.3)
- Border-radius: 16px
- Padding: 24px
- Backdrop-filter: blur(8px)
- Box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15)

**Card 1 - New Users (Top Left)**
- Position: absolute
- Top: 0
- Left: 0
- Width: 200px
- Transform: rotate(-8deg)

**Card 1 Content**
- Label: "New Users"
  - Font-size: 16px
  - Font-weight: 400
  - Color: #A0AEC0
  - Margin-bottom: 8px
- Number: "1,156"
  - Font-size: 48px
  - Font-weight: 700
  - Color: #3B82F6
  - Margin-bottom: 8px
- Percentage Row:
  - Display: flex
  - Align-items: center
  - Gap: 4px
- Percentage: "+15.03%"
  - Font-size: 14px
  - Font-weight: 500
  - Color: #10B981
- Arrow Icon: ↗ (up-right arrow, 14px, #10B981)

**Card 2 - Active Users (Middle)**
- Position: absolute
- Top: 120px
- Left: 100px
- Width: 220px
- Transform: rotate(-5deg)
- Z-index: 2

**Card 2 Content**
- Label: "Active Users"
  - Color: #A0AEC0
- Number: "239k"
  - Color: #8B5CF6
- Percentage: "+6.08%"
  - Color: #10B981

**Card 3 - Views (Bottom Right)**
- Position: absolute
- Top: 260px
- Left: 200px
- Width: 230px
- Transform: rotate(-3deg)
- Z-index: 3

**Card 3 Content**
- Label: "Views"
  - Color: #A0AEC0
- Number: "721k"
  - Color: #06B6D4
- Percentage: "+11.02%"
  - Color: #10B981

**Background Glow Effect**
- Position: absolute
- Width: 400px
- Height: 400px
- Background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)
- Top: 50%
- Left: 50%
- Transform: translate(-50%, -50%)
- Z-index: 0
- Filter: blur(60px)

---

### Logo Bar Section

**Container**
- Width: 100%
- Background: #111827
- Border-radius: 12px
- Padding: 20px 40px
- Margin-top: 64px

**Inner**
- Display: flex
- Align-items: center
- Justify-content: space-between
- Gap: 40px

**Logo Items**
Each logo displayed with:
- Opacity: 0.6
- Filter: grayscale(100%)
- Height: 28px
- Color: #6B7280

**Company Logos (Left to Right)**
1. **Stripe** - Wordmark, 80px width
2. **GitHub** - Logo + wordmark, 90px width
3. **Spotify** - Logo + wordmark, 100px width
4. **Coinbase** - Wordmark, 110px width
5. **Zoom** - Wordmark, 80px width
6. **Opal** - Logo + wordmark, 70px width
7. **Dune** - Logo + wordmark, 80px width
8. **Oasis** - Logo + wordmark, 75px width
9. **Asterisk** - Logo + wordmark, 90px width
10. **Eooks** - Logo + wordmark, 80px width

---

## 4. Components

### Button - Primary
```
Background: #FFFFFF
Color: #0B1121
Font-size: 16px
Font-weight: 600
Padding: 16px 28px
Border-radius: 8px
Border: none
Cursor: pointer
Transition: all 0.2s ease
Hover: opacity: 0.9, transform: translateY(-1px)
```

### Button - Secondary (Gradient Border)
```
Background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)
Border: 1px solid rgba(99, 102, 241, 0.5)
Color: #FFFFFF
Font-size: 16px
Font-weight: 500
Padding: 16px 24px
Border-radius: 8px
Display: flex
Align-items: center
Gap: 8px
Cursor: pointer
Hover: border-color: rgba(99, 102, 241, 0.8)
```

### Button - Navigation (Sign Up)
```
Background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
Color: #FFFFFF
Font-size: 16px
Font-weight: 600
Padding: 12px 24px
Border-radius: 8px
Border: none
```

### Stat Card
```
Background: rgba(21, 31, 56, 0.8)
Border: 1px solid rgba(99, 102, 241, 0.3)
Border-radius: 16px
Padding: 24px
Backdrop-filter: blur(8px)
Box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15)
Min-width: 180px
```

### Avatar Stack
```
Display: flex
Children: margin-left: -12px (except first)
Avatar: 40px × 40px, border-radius: 50%, border: 2px solid #0B1121
```

### Navigation Link
```
Font-size: 16px
Font-weight: 500
Color: #FFFFFF
Text-decoration: none
Padding: 8px 0
Hover: opacity: 0.8
```

---

## 5. Responsive Notes

### Desktop (1280px+)
- Full layout as specified
- Two-column hero layout

### Tablet (768px - 1279px)
- Header navigation may collapse to hamburger
- Hero cards may stack or reduce scale
- Logo bar may become scrollable

### Mobile (< 768px)
- Single column layout
- Hero cards stack vertically
- Navigation becomes hamburger menu
- Logo bar becomes 2 rows or carousel
- Button row stacks vertically
- Heading reduces to 36-40px