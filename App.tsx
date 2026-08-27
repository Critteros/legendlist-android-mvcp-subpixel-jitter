import { LegendList, LegendListRenderItemProps } from '@legendapp/list/react-native';
// Same version with .yarn/patches applied (bias 1e6, pixel-grid roundSize).
import { LegendList as LegendListPatched } from '@legendapp/list-patched/react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// One prepend every 300 ms into a LegendList with maintainVisibleContentPosition.
// On Android the visible rows move by 1 to 2 px on each prepend
//
// The row height must not be a whole dp: the anchor view sits at 1e7 dp, where
// float32 layout can only move in whole dp steps, so a fractional row height is
// what makes the anchor delta and the item delta differ. estimatedItemSize
// matches the row height so LegendList never corrects an estimate and the only
// movement left is that mismatch.

const ITEM = 100.875;
const INITIAL = 40;
const START_INDEX = 5;
const PREPEND_MS = 300;

const keyExtractor = (id: number) => String(id);

function Item({ item }: LegendListRenderItemProps<number>) {
  return (
    <View style={[styles.item, { backgroundColor: item % 2 ? '#dbeafe' : '#fde68a' }]}>
      <Text style={styles.text}>item {item}</Text>
    </View>
  );
}

export default function App() {
  const [running, setRunning] = useState(true);
  const [patched, setPatched] = useState(false);
  const [ids, setIds] = useState(() => Array.from({ length: INITIAL }, (_, i) => INITIAL - i));

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setIds((p) => [p[0] + 1, ...p]), PREPEND_MS);
    return () => clearInterval(t);
  }, [running]);

  const List = patched ? LegendListPatched : LegendList;

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Pressable onPress={() => setRunning((r) => !r)}>
          <Text style={[styles.btn, running && styles.on]}>run</Text>
        </Pressable>
        <Pressable onPress={() => setPatched((p) => !p)}>
          <Text style={[styles.btn, patched && styles.on]}>{patched ? 'patched' : 'stock'}</Text>
        </Pressable>
      </View>
      <List
        // Remount on switch so the new copy starts from a fresh state.
        key={String(patched)}
        style={styles.scroll}
        data={ids}
        keyExtractor={keyExtractor}
        renderItem={Item}
        estimatedItemSize={ITEM}
        recycleItems={false}
        maintainVisibleContentPosition
        initialScrollIndex={START_INDEX}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 60, backgroundColor: '#fff' },
  bar: { flexDirection: 'row', justifyContent: 'space-around' },
  btn: { fontSize: 16, fontWeight: '600', padding: 8, color: '#999' },
  on: { color: '#000' },
  scroll: { flex: 1 },
  item: { height: ITEM, justifyContent: 'center', paddingHorizontal: 16 },
  text: { fontSize: 20 },
});
