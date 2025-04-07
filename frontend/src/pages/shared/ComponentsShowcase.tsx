import {
  Layout,
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/shared'

export function ComponentsShowcase() {
  return (
    <Layout>
      <PageHeader>
        <PageHeaderHeading>Components Showcase</PageHeaderHeading>
        <PageHeaderDescription>A showcase of all base components</PageHeaderDescription>
      </PageHeader>

      <div className="space-y-8">
        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Available button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="text">Text Button</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small Button</Button>
              <Button size="md">Medium Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button isLoading>Loading Button</Button>
              <Button disabled>Disabled Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Different input states and variations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Default Input" placeholder="Enter some text" />
            <Input
              label="Input with Error"
              placeholder="Enter some text"
              error="This field is required"
            />
            <Input label="Disabled Input" placeholder="This input is disabled" disabled />
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Card variations and layouts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>A simple card with no hover effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="hover">
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
                <CardDescription>A card with hover effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary">Action</Button>
              </CardFooter>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
