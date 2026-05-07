import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KotoBird } from '@/components/KotoBird';

type SectionProps = {
  icon: string;
  title: string;
  steps: string[];
};

function Section({ icon, title, steps }: SectionProps) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionIcon}>{icon}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {steps.map((step, i) => (
        <View key={i} style={s.stepRow}>
          <View style={s.stepNum}>
            <Text style={s.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={s.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HowToScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#F9FAFB" />
          <Text style={s.backText}>戻る</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroWrap}>
          <KotoBird size={80} />
          <Text style={s.heroTitle}>KotoClipの使い方</Text>
          <Text style={s.heroSub}>単語の保存から復習まで、全部説明します。</Text>
        </View>

        <Section
          icon="📱"
          title="スマホから単語を保存する"
          steps={[
            'SafariやChromeなど好きなブラウザで英語サイトを開く',
            '気になった単語を長押しして選択する',
            '「共有」ボタン（□↑）をタップ',
            '共有メニューから「KotoClip」を選ぶ',
            '意味が自動で入力されるので確認して保存',
          ]}
        />

        <Section
          icon="💻"
          title="PCブラウザ拡張で保存する"
          steps={[
            'ChromeまたはEdgeのウェブストアでKotoClip拡張機能を検索してインストールする',
            '英語のWebページを開き、気になった単語をドラッグで選択する',
            'ページ上に表示されるKotoClipアイコンをクリックする',
            '意味が自動入力されるので確認して「保存」をクリック',
            '保存した単語はスマホアプリでそのまま復習できる',
          ]}
        />

        <Section
          icon="✏️"
          title="手動で単語を追加する"
          steps={[
            '下のタブから「手動追加」を開く',
            '英単語またはフレーズを入力する',
            '「AIで意味を自動入力」をタップすると訳と例文が入力される',
            '内容を確認して「保存する」をタップ',
          ]}
        />

        <Section
          icon="🔁"
          title="復習の仕組み"
          steps={[
            '登録した単語は忘れかけたタイミングで自動的に出てくる（間隔反復）',
            '正解するたびに次の復習が遠くなり、間違えると近くなる',
            '5回正解すると「定着済み」になる',
            '毎日の復習を続けることでストリーク（連続日数）が伸びる',
          ]}
        />

        <Section
          icon="⚡"
          title="今日の出会いとは？"
          steps={[
            'スマホで英語を読んでいて知っていた単語（覚えてた）と曖昧だった単語（曖昧）が記録される',
            'Share Extensionで保存するとき、「知ってた」「曖昧だった」を選べる',
            'ホーム画面の「Today\'s Encounters」に表示される',
          ]}
        />

        <View style={s.faqSection}>
          <Text style={s.faqTitle}>よくある質問</Text>

          <View style={s.faqItem}>
            <Text style={s.faqQ}>Q. アプリを開かなくても単語を保存できる？</Text>
            <Text style={s.faqA}>はい。Shareメニューから直接KotoClipに保存できます。アプリを開く必要はありません。</Text>
          </View>

          <View style={s.faqItem}>
            <Text style={s.faqQ}>Q. 保存した単語はいつ復習に出てくる？</Text>
            <Text style={s.faqA}>初回は翌日から出てきます。正解するたびに間隔が伸び、数週間・数ヶ月後に出てくるようになります。</Text>
          </View>

          <View style={s.faqItem}>
            <Text style={s.faqQ}>Q. 復習はどのくらいの時間かかる？</Text>
            <Text style={s.faqA}>1日5〜10問が目安です。毎日続けることが大切なので、短くても構いません。</Text>
          </View>

          <View style={s.faqItem}>
            <Text style={s.faqQ}>Q. PCで保存した単語はスマホで見られる？</Text>
            <Text style={s.faqA}>はい。同じアカウントでログインすれば、PCブラウザ拡張で保存した単語をスマホアプリですぐに復習できます。</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  scroll: { paddingBottom: 60 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backText: { color: '#F9FAFB', fontSize: 16 },

  heroWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: '#8F99A8',
    textAlign: 'center',
    lineHeight: 21,
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(21,26,34,0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2DD4BF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 21,
  },

  faqSection: {
    marginHorizontal: 16,
    marginTop: 4,
    gap: 12,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  faqItem: {
    backgroundColor: 'rgba(21,26,34,0.98)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 6,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E9EDF2',
    lineHeight: 20,
  },
  faqA: {
    fontSize: 13,
    color: '#8F99A8',
    lineHeight: 20,
  },
});
