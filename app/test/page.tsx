import { Triangle } from "@/components/triangle";

export default function Test() {
  return (
    <div>
      <h1>Testi</h1>
      <Triangle points="50,50 250,50 250,150 50,150" />
      <Triangle points="50,150 250,190 250,50" />
      <Triangle points="50,50 250,50 200,150 100,150" />
    </div>
  );
}
