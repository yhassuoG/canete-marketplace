import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RestauranteDetailRedirect({ params }: Readonly<Props>) {
  const { slug } = await params;
  redirect(`/${slug}`);
}

