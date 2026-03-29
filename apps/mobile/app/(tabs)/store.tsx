import { ScrollView, Text, View } from "react-native";
import { storeItems } from "../../src/content";
import { ActionButton, Screen, SectionTitle, Surface } from "../../src/components/ui";

export default function StoreScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Surface>
          <SectionTitle
            eyebrow="Store"
            title="Products and plans"
            subtitle="This surface is ready for carts, checkout, and subscriptions later."
          />
        </Surface>

        {storeItems.map((item) => (
          <Surface key={item.title} compact>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#122036" }}>{item.title}</Text>
              <Text style={{ color: "#607084" }}>{item.detail}</Text>
              <Text style={{ color: "#122036", fontWeight: "700" }}>{item.price}</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <ActionButton label="Add to cart" onPress={() => {}} />
            </View>
          </Surface>
        ))}
      </ScrollView>
    </Screen>
  );
}

