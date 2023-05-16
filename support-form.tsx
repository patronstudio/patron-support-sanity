import { useState, useEffect, ReactNode } from 'react'
import { useCurrentUser } from 'sanity'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import Dropzone from 'react-dropzone'
import classNames from 'classnames'
import {
  Stack,
  Heading,
  Card,
  Box,
  Button,
  Grid,
  Text,
  Flex,
  LabelSkeleton,
  Skeleton,
  Label,
  TextInput,
  TextArea,
  Spinner
} from '@sanity/ui'
import { SelectIcon, ErrorOutlineIcon } from '@sanity/icons'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
ChartJS.register(ArcElement, Tooltip)

import { ClickUpIssueTypes, TicketStatus } from './types'

import s from './styles.module.css'

interface Props {
  patronApiUrl: string
  tickets: TicketStatus
  issueTypes: Array<ClickUpIssueTypes>
  isDataLoading: boolean
  setRefreshData: (
    value: null | boolean | ((prevState: null | boolean) => null | boolean)
  ) => void
}

interface Form {
  issue_type: string
  name: string
  description: string
  attachment: Array<File>
  user_name: string
  from_email: string
  telephone: string
}

const MetricCardSkeleton = () => {
  return (
    <Stack flex={1} space={2}>
      <LabelSkeleton radius={1} animated />
      <LabelSkeleton radius={1} animated style={{ width: '50px' }} />
    </Stack>
  )
}

const FormLabel = ({
  label,
  isInvalid
}: {
  label: string
  isInvalid: boolean
}) => {
  if (!label) return null
  return (
    <Flex align="center">
      <Label size={3}>{label}</Label>
      <ErrorOutlineIcon
        width={20}
        height={20}
        style={{
          opacity: isInvalid ? 1 : 0,
          marginLeft: '0.25rem',
          color: '#F03E2F'
        }}
      />
    </Flex>
  )
}

const FormErrorLabel = ({ label }: { label: string }) => {
  if (!label) return null
  return (
    <Text size={1} style={{ color: '#962C23' }}>
      {label}
    </Text>
  )
}

export const SupportForm = ({
  patronApiUrl,
  tickets,
  issueTypes,
  setRefreshData,
  isDataLoading
}: Props) => {
  const defaultValues: Form = {
    issue_type: '',
    name: '',
    description: '',
    attachment: null,
    user_name: '',
    from_email: '',
    telephone: ''
  }
  const methods = useForm<Form>({ defaultValues })
  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    resetField,
    formState: { errors, isSubmitting, isSubmitted, isSubmitSuccessful }
  } = methods
  const user = useCurrentUser()
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [formStatus, setFormStatus] = useState<{
    status: 'success' | 'error'
    title: ReactNode
  } | null>(null)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    if (!isSubmitted || apiError) return

    return window.scrollTo({
      top: document.getElementById('scroll-to-support-request').offsetTop - 120,
      behavior: 'smooth'
    })
  }, [isSubmitted, apiError])

  const { open, inProgress, blocked, complete } = tickets || {}

  const doughnutData: Array<{
    name:
      | 'Open'
      | 'Blocked'
      | 'In Progress'
      | 'Completed (within the last 12 months)'
    tickets: number
    color: string
  }> = [
    {
      name: 'Open',
      tickets: open,
      color: open > 0 ? '#f59e0b' : '#6b7280'
    },
    {
      name: 'Blocked',
      tickets: blocked,
      color: blocked > 0 ? '#64748b' : '#6b7280'
    },
    {
      name: 'In Progress',
      tickets: inProgress,
      color: inProgress > 0 ? '#06b6d4' : '#6b7280'
    },
    {
      name: 'Completed (within the last 12 months)',
      tickets: complete,
      color: '#10b981'
    }
  ]

  const handleFormReset = () => {
    reset(defaultValues)
  }

  const onSubmit: SubmitHandler<Form> = async (formData) => {
    console.log('formData: ', formData)

    setIsLoading(true)

    if (Object.keys(errors).length > 0) {
      setApiError(true)
      setFormStatus({
        status: 'error',
        title: (
          <>
            Please fill out fields marked{' '}
            <ErrorOutlineIcon
              style={{
                margin: '0 0.25rem',
                color: '#F03E2F'
              }}
            />{' '}
            in red
          </>
        )
      })
      setIsLoading(false)
      return
    }

    try {
      const attachmentFormData = new FormData()
      attachmentFormData.append('file', formData.attachment[0])
      attachmentFormData.append('upload_preset', 'patron_support_form_asset')
      const attachmentResp = await fetch(
        `https://api.cloudinary.com/v1_1/patron-studio/upload`,
        {
          method: 'POST',
          body: attachmentFormData
        }
      )
      const attachmentData = await attachmentResp.json()

      if (!attachmentResp.ok || !attachmentData?.secure_url) {
        throw new Error(attachmentData.message || 'Attachment upload failed')
      }

      const resp = await fetch(`${patronApiUrl}/patron-support-form`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          screenshot: attachmentData.secure_url
        })
      })

      if (!resp.ok) {
        throw new Error(`Error submitting form. ${resp.statusText}`)
      }

      const data = await resp.json()

      if (!data?.ticketId) {
        throw new Error('No Ticket ID was returned')
      }

      setTicketId(data.ticketId)
      setRefreshData((prev: boolean) => !prev)
      handleFormReset()
    } catch (error) {
      setApiError(true)
      if (error.message) {
        setFormStatus({
          status: 'error',
          title: error.message
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      paddingX={[2, 2, 2, 5]}
      paddingBottom={[4, 4, 4, 6]}
      paddingTop={0}
      style={{ backgroundColor: '#101112' }}
    >
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Box
          id="scroll-to-support-request"
          paddingY={[5, 5, 5, 6]}
          style={{ backgroundColor: '#fff' }}
        >
          <Grid columns={[1, 1, 1, 2]} paddingX={[4, 4, 4, 6]}>
            <Stack space={[5, 5, 5, 6]} paddingRight={[0, 0, 0, 4]}>
              {isSubmitSuccessful && !apiError ? (
                <Stack space={[6, 6, 6, 7]} paddingBottom={[6, 6, 6, 4]}>
                  <Heading
                    as="h2"
                    size={[2, 2, 2, 4]}
                    style={{ color: '#101112' }}
                  >
                    Thank you for submitting your request
                  </Heading>
                  <Stack space={[5, 5, 5, 6]}>
                    <Heading
                      as="h3"
                      size={[2, 2, 2, 3]}
                      style={{ color: '#101112' }}
                    >
                      Ticket ID #{ticketId}
                    </Heading>
                    <Stack space={5}>
                      <Text
                        size={[2, 2, 2, 3]}
                        weight="regular"
                        style={{ color: '#101112' }}
                      >
                        An email with your ticket details has been sent to you.
                      </Text>
                      <Text
                        size={[2, 2, 2, 3]}
                        weight="regular"
                        style={{ color: '#101112' }}
                      >
                        A member of the support team will be in contact shortly.
                      </Text>
                    </Stack>
                  </Stack>
                  <Box>
                    <Button
                      className={s.addAnotherTicketBtn}
                      padding={4}
                      fontSize={3}
                      tone="primary"
                      mode="default"
                      text="Add Another Ticket"
                      onClick={handleFormReset}
                    />
                  </Box>
                </Stack>
              ) : (
                <>
                  {isDataLoading || issueTypes?.length < 1 ? (
                    <Box paddingBottom={[6, 6, 6, 0]}>
                      <Stack space={4} paddingBottom={6}>
                        <LabelSkeleton radius={1} animated />
                        <LabelSkeleton
                          radius={1}
                          animated
                          style={{ width: '50%' }}
                        />
                      </Stack>
                      <Stack space={[4, 4, 4, 5]}>
                        <LabelSkeleton radius={1} animated />
                        <LabelSkeleton radius={1} animated />
                        <LabelSkeleton
                          radius={1}
                          animated
                          style={{ height: '100px' }}
                        />
                        <LabelSkeleton radius={1} animated />
                        <LabelSkeleton radius={1} animated />
                        <Grid columns={[1, 1, 1, 2]} gap={[4, 4, 4, 2]}>
                          <LabelSkeleton radius={1} animated />
                          <LabelSkeleton radius={1} animated />
                        </Grid>
                        <LabelSkeleton
                          radius={1}
                          animated
                          style={{ width: '150px', marginLeft: 'auto' }}
                        />
                      </Stack>
                    </Box>
                  ) : (
                    <>
                      <Heading size={[2, 2, 2, 4]} style={{ color: '#101112' }}>
                        Hi, {user.name}. <br />
                        Have a support issue?
                      </Heading>
                      <form
                        className={s.form}
                        onSubmit={handleSubmit(onSubmit)}
                      >
                        <Stack space={4}>
                          <Stack space={3}>
                            <FormLabel
                              label="Type of Issue"
                              isInvalid={errors?.issue_type ? true : false}
                            />
                            <Stack space={2}>
                              <div className={s.formInputSelectWrap}>
                                <select
                                  className={classNames(
                                    s.formSelectInput,
                                    s.formInput,
                                    {
                                      [s.formInputError]: errors?.issue_type
                                    }
                                  )}
                                  defaultValue="DEFAULT"
                                  {...register('issue_type', {
                                    required: 'Type of issue is required'
                                  })}
                                >
                                  <option value="">Select</option>
                                  {issueTypes.map(({ name, orderindex }) => (
                                    <option key={name} value={orderindex}>
                                      {name}
                                    </option>
                                  ))}
                                </select>
                                <SelectIcon className={s.formInputSelectIcon} />
                              </div>
                              {errors?.issue_type && (
                                <FormErrorLabel label="Type of issue is required" />
                              )}
                            </Stack>
                          </Stack>
                          <Stack space={3}>
                            <FormLabel
                              label="Ticket Name"
                              isInvalid={errors?.name ? true : false}
                            />
                            <Stack space={2}>
                              <TextInput
                                className={classNames(s.formInput, {
                                  [s.formInputError]: errors?.name
                                })}
                                fontSize={[2, 2, 2, 3]}
                                placeholder="A brief description of the issue"
                                {...register('name', {
                                  required: 'Ticket name is required'
                                })}
                              />
                              {errors?.name && (
                                <FormErrorLabel label="Ticket name is required" />
                              )}
                            </Stack>
                          </Stack>
                          <Stack space={3}>
                            <FormLabel
                              label="Description"
                              isInvalid={errors?.description ? true : false}
                            />
                            <Stack space={2}>
                              <TextArea
                                className={classNames(s.formInput, {
                                  [s.formInputError]: errors?.description
                                })}
                                rows={4}
                                fontSize={[2, 2, 2, 3]}
                                placeholder="Detailed description"
                                {...register('description', {
                                  required: 'Description required'
                                })}
                              />
                              {errors?.description && (
                                <FormErrorLabel label="Description is required" />
                              )}
                            </Stack>
                          </Stack>
                          <Stack space={3}>
                            <FormLabel
                              label="Add Attachment"
                              isInvalid={errors?.attachment ? true : false}
                            />
                            <Controller
                              control={control}
                              name="attachment"
                              rules={{ required: true }}
                              render={({ field: { onChange, value } }) => (
                                <Dropzone
                                  noClick
                                  onDrop={(acceptedFiles) =>
                                    setValue('attachment', acceptedFiles, {
                                      shouldValidate: true
                                    })
                                  }
                                  accept={{
                                    'image/jpeg': ['.jpg', '.jpeg'],
                                    'image/png': ['.png'],
                                    'application/zip': ['.zip']
                                  }}
                                  validator={(file) => {
                                    if (file.size > 10_000_000) {
                                      return {
                                        code: 'file-too-large',
                                        message: 'Max file size is 10MB.'
                                      }
                                    }
                                    return null
                                  }}
                                >
                                  {({
                                    getRootProps,
                                    getInputProps,
                                    open,
                                    isDragActive,
                                    fileRejections
                                  }) => (
                                    <div {...getRootProps()}>
                                      <Card
                                        padding={[3, 3, 3, 4]}
                                        shadow={1}
                                        style={{
                                          backgroundColor: isDragActive
                                            ? 'rgba(0,0,0,0.1)'
                                            : errors?.attachment
                                            ? '#fdebea'
                                            : 'transparent',
                                          border: errors?.attachment
                                            ? '1px solid #f03e2f'
                                            : ''
                                        }}
                                      >
                                        <Flex align="center">
                                          {value?.[0]?.name ? (
                                            <>
                                              <Button
                                                type="button"
                                                fontSize={[1, 1, 1, 2]}
                                                padding={[2, 2, 2, 3]}
                                                tone="default"
                                                onClick={() =>
                                                  resetField('attachment')
                                                }
                                                text={
                                                  <span
                                                    style={{
                                                      color: '#fff'
                                                    }}
                                                  >
                                                    Remove attachment file
                                                  </span>
                                                }
                                                style={{
                                                  backgroundColor: '#101112',
                                                  boxShadow: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              />
                                              <Text
                                                style={{
                                                  marginLeft: '10px',
                                                  color: '#101112'
                                                }}
                                              >
                                                {value[0].name}
                                              </Text>
                                            </>
                                          ) : (
                                            <>
                                              <Button
                                                type="button"
                                                fontSize={[1, 1, 1, 2]}
                                                padding={[2, 2, 2, 3]}
                                                tone="default"
                                                onClick={open}
                                                text={
                                                  <span
                                                    style={{
                                                      color: '#fff'
                                                    }}
                                                  >
                                                    Upload a file
                                                  </span>
                                                }
                                                style={{
                                                  backgroundColor: '#101112',
                                                  boxShadow: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              />
                                              {(fileRejections.length > 0 &&
                                                fileRejections
                                                  .map(({ errors }) =>
                                                    errors.map(
                                                      ({ code, message }) => (
                                                        <Text
                                                          key={code}
                                                          style={{
                                                            marginLeft: '10px',
                                                            color: '#101112'
                                                          }}
                                                        >
                                                          {code ===
                                                          'file-invalid-type'
                                                            ? 'File type must be PNG, JPG or ZIP'
                                                            : message}
                                                        </Text>
                                                      )
                                                    )
                                                  )
                                                  .flat()) || (
                                                <Text
                                                  style={{
                                                    opacity: 0.6,
                                                    marginLeft: '10px',
                                                    color: '#101112'
                                                  }}
                                                >
                                                  or drag and drop
                                                </Text>
                                              )}
                                            </>
                                          )}
                                        </Flex>
                                        <input
                                          type="file"
                                          {...getInputProps({
                                            onChange
                                          })}
                                        />
                                      </Card>
                                    </div>
                                  )}
                                </Dropzone>
                              )}
                            />
                            {errors?.attachment && (
                              <FormErrorLabel label="Attachment is required" />
                            )}
                          </Stack>
                          <Stack space={3}>
                            <FormLabel
                              label="Contact Name"
                              isInvalid={errors?.user_name ? true : false}
                            />
                            <Stack space={2}>
                              <TextInput
                                className={classNames(s.formInput, {
                                  [s.formInputError]: errors?.user_name
                                })}
                                fontSize={[2, 2, 2, 3]}
                                {...register('user_name', {
                                  required: 'Contact name is required'
                                })}
                              />
                              {errors?.user_name && (
                                <FormErrorLabel label="Contact name is required" />
                              )}
                            </Stack>
                          </Stack>
                          <Grid columns={[1, 1, 1, 2]} gap={[4, 4, 4, 2]}>
                            <Stack space={3}>
                              <FormLabel
                                label="Email"
                                isInvalid={errors?.from_email ? true : false}
                              />
                              <Stack space={2}>
                                <TextInput
                                  className={classNames(s.formInput, {
                                    [s.formInputError]: errors?.from_email
                                  })}
                                  type="email"
                                  fontSize={[2, 2, 2, 3]}
                                  {...register('from_email', {
                                    required: 'Valid email is required',
                                    pattern:
                                      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                                  })}
                                />
                                {errors?.from_email && (
                                  <FormErrorLabel label="Valid email is required" />
                                )}
                              </Stack>
                            </Stack>
                            <Stack space={3}>
                              <FormLabel
                                label="telephone"
                                isInvalid={errors?.telephone ? true : false}
                              />
                              <Stack space={2}>
                                <TextInput
                                  className={classNames(s.formInput, {
                                    [s.formInputError]: errors?.telephone
                                  })}
                                  type="tel"
                                  fontSize={[2, 2, 2, 3]}
                                  {...register('telephone', {
                                    required: 'Valid telephone is required',
                                    pattern: /^[0-9+-]+$/
                                  })}
                                />
                                {errors?.telephone && (
                                  <FormErrorLabel label="Valid telephone is required" />
                                )}
                              </Stack>
                            </Stack>
                          </Grid>
                          <Flex
                            justify="flex-end"
                            style={{ position: 'relative', marginLeft: 'auto' }}
                          >
                            <Button
                              className={classNames(s.submitBtn, {
                                [s.submitBtnEnabled]:
                                  Object.keys(errors).length < 1 ||
                                  !isSubmitting
                              })}
                              type="submit"
                              fontSize={[2, 2, 2, 3]}
                              padding={[3, 3, 3, 4]}
                              tone="default"
                              onClick={() => handleSubmit(onSubmit)}
                              text={
                                <span
                                  style={{
                                    color: '#fff'
                                  }}
                                >
                                  Create Ticket
                                </span>
                              }
                              disabled={
                                Object.keys(errors).length > 0 || isSubmitting
                              }
                            />
                            {isLoading && (
                              <Flex
                                justify="center"
                                align="center"
                                style={{
                                  position: 'absolute',
                                  top: '0',
                                  left: '0',
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#101112',
                                  zIndex: 1
                                }}
                              >
                                <Spinner style={{ color: '#fff' }} />
                              </Flex>
                            )}
                          </Flex>
                          {formStatus?.status && (
                            <Flex
                              align="center"
                              style={{
                                marginLeft: 'auto',
                                padding: '8px 17px',
                                fontWeight: '600',
                                borderRadius: '3px',
                                backgroundColor:
                                  formStatus.status === 'success'
                                    ? '#E7F9ED'
                                    : '#FDEBEA',
                                boxShadow:
                                  formStatus.status === 'success'
                                    ? '0px 1px 18px rgba(58, 181, 100, 0.12), 0px 6px 10px rgba(58, 181, 100, 0.14), 0px 3px 5px -1px rgba(58, 181, 100, 0.2), 0px 0px 0px 1px rgba(58, 181, 100, 0.4)'
                                    : '0px 1px 18px rgba(240, 62, 47, 0.12), 0px 6px 10px rgba(240, 62, 47, 0.14), 0px 3px 5px -1px rgba(240, 62, 47, 0.2), 0px 0px 0px 1px rgba(240, 62, 47, 0.4)'
                              }}
                            >
                              {formStatus.title}
                            </Flex>
                          )}
                        </Stack>
                      </form>
                    </>
                  )}
                </>
              )}
            </Stack>
            <Stack space={[5, 5, 5, 6]} paddingLeft={[0, 0, 0, 7]}>
              {isDataLoading || !tickets ? (
                <>
                  <LabelSkeleton radius={1} animated />
                  <Flex align="center" justify="center">
                    <Skeleton padding={7} radius={6} animated />
                  </Flex>
                  <Stack space={[2, 2, 2, 4]}>
                    <Grid columns={[1, 1, 1, 3]} gap={2}>
                      <MetricCardSkeleton />
                      <MetricCardSkeleton />
                      <MetricCardSkeleton />
                    </Grid>
                    <MetricCardSkeleton />
                  </Stack>
                </>
              ) : (
                <>
                  <Heading size={[2, 2, 2, 4]} style={{ color: '#101112' }}>
                    Tickets
                  </Heading>
                  <Stack space={[3, 3, 3, 4]}>
                    <Box className={s.doughnutContainer}>
                      {tickets &&
                      Object.values(tickets).every((v) => v === 0) ? (
                        <Flex justify="center">
                          <svg
                            fill="none"
                            height="166"
                            viewBox="0 0 167 166"
                            width="167"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="83.75"
                              cy="83"
                              r="74.5"
                              stroke="#2abe8e"
                              strokeWidth="17"
                            />
                            <path
                              d="m70.0703 82.7599 11.2 11.2 20.1597-19.936"
                              stroke="#10b981"
                              strokeWidth="3"
                            />
                          </svg>
                        </Flex>
                      ) : (
                        <>
                          <div className={s.doughnutWrap}>
                            <Doughnut
                              data={{
                                labels: doughnutData
                                  .filter((t) => t.name)
                                  .map((item) => item.name),
                                datasets: [
                                  {
                                    label: ' ',
                                    data: doughnutData
                                      .filter((t) => t.tickets)
                                      .map((item) => item.tickets),
                                    backgroundColor: doughnutData.map(
                                      (item) => item.color
                                    )
                                  }
                                ]
                              }}
                              options={{
                                cutout: '80%',
                                responsive: true,
                                maintainAspectRatio: false
                              }}
                            />
                          </div>
                          <Text className={s.doughnutTotal} size={3}>
                            {open + inProgress + blocked}
                          </Text>
                        </>
                      )}
                    </Box>
                    <Grid columns={[1, 1, 1, 3]} gap={[3, 3, 3, 4]}>
                      {doughnutData
                        .filter(
                          (f) =>
                            f.name !== 'Completed (within the last 12 months)'
                        )
                        .map(({ name, tickets, color }) => (
                          <Stack
                            key={name}
                            className={s.metricBox}
                            padding={4}
                            space={3}
                            style={{ borderTopColor: color }}
                          >
                            <Text
                              size={1}
                              style={{
                                color: '#6B7280'
                              }}
                            >
                              {name}
                            </Text>
                            <Heading
                              size={3}
                              style={{
                                color: '#101112'
                              }}
                            >
                              {tickets}
                            </Heading>
                          </Stack>
                        ))}
                    </Grid>
                    <Stack
                      className={s.metricBox}
                      padding={4}
                      space={3}
                      style={{ borderTopColor: doughnutData[3].color }}
                    >
                      <Text
                        size={1}
                        style={{
                          color: '#6B7280'
                        }}
                      >
                        {doughnutData[3].name}
                      </Text>
                      <Heading
                        size={3}
                        style={{
                          color: '#101112'
                        }}
                      >
                        {complete}
                      </Heading>
                    </Stack>
                  </Stack>
                </>
              )}
            </Stack>
          </Grid>
        </Box>
      </Box>
    </Box>
  )
}

export default SupportForm
