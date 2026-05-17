import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const CustomFooter: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  const year = new Date().getFullYear()
  return (
    <footer class={`${displayClass ?? ""}`}>
      <p class="manifest">
        Bez cíle, bez plánu, syrově.
      </p>
      <p class="contact">
        <a href="mailto:taxi-jest.0v@icloud.com">Chci ti napsat</a>
      </p>
      <p class="copyright">
        © {year}
      </p>
    </footer>
  )
}

export default (() => CustomFooter) satisfies QuartzComponentConstructor